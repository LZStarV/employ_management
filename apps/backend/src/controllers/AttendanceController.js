const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');

class AttendanceController {
  /**
   * 获取考勤列表
   */
  static async getAttendanceList(ctx) {
    try {
      const { employeeId, departmentId, date, startDate, endDate, status, page = 1, pageSize = 20 } = ctx.query;
      
      // 构建查询条件
      const where = {};
      
      if (employeeId) {
        where.employee_id = parseInt(employeeId);
      }
      
      if (date) {
        where.attendance_date = date;
      } else if (startDate && endDate) {
        where.attendance_date = {
          [Op.between]: [startDate, endDate]
        };
      }
      
      if (status) {
        where.status = status;
      }
      
      // 构建关联查询条件
      const include = [
        {
          model: sequelize.models.Employee,
          as: 'employee',
          attributes: ['first_name', 'last_name'],
          include: [
            {
              model: sequelize.models.Department,
              as: 'department',
              attributes: ['department_name']
            }
          ]
        }
      ];
      
      // 部门筛选
      if (departmentId) {
        include[0].include[0].where = {
          department_id: parseInt(departmentId)
        };
      }
      
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);
      
      // 查询考勤记录
      const { count, rows } = await sequelize.models.Attendance.findAndCountAll({
        where,
        include,
        offset,
        limit,
        order: [['attendance_date', 'DESC']]
      });
      
      // 格式化返回数据
      const formattedData = rows.map(attendance => {
        const employee = attendance.employee;
        const department = employee?.department;
        
        // 计算工作时长
        let workHours = 0;
        if (attendance.check_in_time && attendance.check_out_time) {
          const checkIn = new Date(`2000-01-01T${attendance.check_in_time}`);
          const checkOut = new Date(`2000-01-01T${attendance.check_out_time}`);
          const diffMs = checkOut - checkIn;
          workHours = Math.max(diffMs / (1000 * 60 * 60), 0);
        }
        
        // 状态映射
        const statusMap = {
          'present': '正常',
          'absent': '缺勤',
          'late': '迟到',
          'early_leave': '早退',
          'sick_leave': '病假',
          'annual_leave': '年假'
        };
        
        return {
          attendance_id: attendance.attendance_id,
          employee_id: attendance.employee_id,
          employee_name: employee ? `${employee.first_name}${employee.last_name}` : '未知员工',
          department_name: department ? department.department_name : '未知部门',
          date: attendance.attendance_date,
          check_in_time: attendance.check_in_time ? `2000-01-01T${attendance.check_in_time}Z` : null,
          check_out_time: attendance.check_out_time ? `2000-01-01T${attendance.check_out_time}Z` : null,
          work_hours: parseFloat(workHours.toFixed(2)),
          status: attendance.status,
          remark: statusMap[attendance.status] || attendance.status
        };
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: formattedData,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    } catch (error) {
      console.error('获取考勤列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '获取考勤列表失败'
      };
    }
  }

  /**
   * 获取员工考勤详情
   */
  static async getEmployeeAttendanceDetail(ctx) {
    try {
      const { employeeId } = ctx.params;
      const { startDate, endDate, page = 1, pageSize = 20 } = ctx.query;
      
      // 查询员工信息
      const employee = await sequelize.models.Employee.findByPk(employeeId, {
        include: [
          {
            model: sequelize.models.Department,
            as: 'department',
            attributes: ['department_name']
          }
        ]
      });
      
      if (!employee) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: '员工不存在'
        };
        return;
      }
      
      // 构建考勤查询条件
      const where = {
        employee_id: parseInt(employeeId)
      };
      
      if (startDate && endDate) {
        where.attendance_date = {
          [Op.between]: [startDate, endDate]
        };
      }
      
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);
      
      // 查询考勤记录（带分页）
      const { count, rows: attendances } = await sequelize.models.Attendance.findAndCountAll({
        where,
        offset,
        limit,
        order: [['attendance_date', 'DESC']]
      });
      
      // 格式化考勤记录
      const attendanceRecords = attendances.map(attendance => {
        // 计算工作时长
        let workHours = 0;
        if (attendance.check_in_time && attendance.check_out_time) {
          const checkIn = new Date(`2000-01-01T${attendance.check_in_time}`);
          const checkOut = new Date(`2000-01-01T${attendance.check_out_time}`);
          const diffMs = checkOut - checkIn;
          workHours = Math.max(diffMs / (1000 * 60 * 60), 0);
        }
        
        // 状态映射
        const statusMap = {
          'present': '正常',
          'absent': '缺勤',
          'late': '迟到',
          'early_leave': '早退',
          'sick_leave': '病假',
          'annual_leave': '年假'
        };
        
        return {
          date: attendance.attendance_date,
          check_in_time: attendance.check_in_time ? `2000-01-01T${attendance.check_in_time}Z` : null,
          check_out_time: attendance.check_out_time ? `2000-01-01T${attendance.check_out_time}Z` : null,
          work_hours: parseFloat(workHours.toFixed(2)),
          status: attendance.status,
          remark: statusMap[attendance.status] || attendance.status
        };
      });
      
      // 使用数据库聚合函数计算统计信息，避免加载所有数据
      const statsResult = await sequelize.models.Attendance.findAll({
        where,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('attendance_id')), 'total_days'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'work_days'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'late' THEN 1 ELSE 0 END")), 'late_count'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END")), 'early_leave_count'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'absent' THEN 1 ELSE 0 END")), 'absent_count'],
          [sequelize.fn('SUM', sequelize.col('overtime_hours')), 'overtime_hours']
        ],
        raw: true
      });
      
      const stats = statsResult[0] || {};
      
      const statistics = {
        total_days: parseInt(stats.total_days) || 0,
        work_days: parseInt(stats.work_days) || 0,
        late_count: parseInt(stats.late_count) || 0,
        early_leave_count: parseInt(stats.early_leave_count) || 0,
        absent_count: parseInt(stats.absent_count) || 0,
        overtime_hours: parseFloat(stats.overtime_hours || 0)
      };
      
      statistics.attendance_rate = statistics.total_days > 0 ? 
        parseFloat(((statistics.work_days / statistics.total_days) * 100).toFixed(2)) : 0;
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: {
          employee_id: employee.employee_id,
          employee_name: `${employee.first_name}${employee.last_name}`,
          department_name: employee.department ? employee.department.department_name : '未知部门',
          attendance_records: attendanceRecords,
          statistics: statistics,
          pagination: {
            total: count,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(count / parseInt(pageSize))
          }
        }
      };
    } catch (error) {
      console.error('获取员工考勤详情失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '获取员工考勤详情失败'
      };
    }
  }

  /**
   * 获取考勤统计
   */
  static async getAttendanceStatistics(ctx) {
    try {
      const { departmentId, startDate, endDate } = ctx.query;
      
      // 构建查询条件
      const where = {};
      
      if (startDate && endDate) {
        where.attendance_date = {
          [Op.between]: [startDate, endDate]
        };
      }
      
      // 使用数据库聚合函数计算总体统计，避免加载所有数据
      const overallStats = await sequelize.models.Attendance.findAll({
        where,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('attendance_id')), 'total_records'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'present_count'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'late' THEN 1 ELSE 0 END")), 'late_count'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END")), 'early_leave_count'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'absent' THEN 1 ELSE 0 END")), 'absent_count'],
          [sequelize.fn('SUM', sequelize.col('overtime_hours')), 'overtime_hours']
        ],
        raw: true
      });
      
      const stats = overallStats[0] || {};
      
      // 计算总体统计
      const totalEmployees = await sequelize.models.Employee.count({
        where: { status: 'active' }
      });
      
      const presentCount = parseInt(stats.present_count) || 0;
      const lateCount = parseInt(stats.late_count) || 0;
      const earlyLeaveCount = parseInt(stats.early_leave_count) || 0;
      const absentCount = parseInt(stats.absent_count) || 0;
      const overtimeHours = parseFloat(stats.overtime_hours || 0);
      const totalRecords = parseInt(stats.total_records) || 0;
      
      const attendanceRate = totalRecords > 0 ? 
        parseFloat(((presentCount / totalRecords) * 100).toFixed(2)) : 0;
      
      // 按部门统计（使用更简单的方法）
      const departmentStatsQuery = await sequelize.query(`
        SELECT 
          d.department_name,
          COUNT(a.attendance_id) as total_count,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
          SUM(CASE WHEN a.status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_count,
          SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count
        FROM attendances a
        LEFT JOIN employees e ON a.employee_id = e.employee_id
        LEFT JOIN departments d ON e.department_id = d.department_id
        ${startDate && endDate ? `WHERE a.attendance_date BETWEEN '${startDate}' AND '${endDate}'` : ''}
        GROUP BY d.department_id, d.department_name
        ORDER BY d.department_name
      `, {
        type: sequelize.QueryTypes.SELECT,
        raw: true
      });
      
      // 格式化部门统计
      const departmentStatsArray = departmentStatsQuery.map(dept => {
        const totalCount = parseInt(dept.total_count) || 0;
        const presentCount = parseInt(dept.present_count) || 0;
        
        return {
          department_name: dept.department_name || '未知部门',
          attendance_rate: totalCount > 0 ? 
            parseFloat(((presentCount / totalCount) * 100).toFixed(2)) : 0,
          late_count: parseInt(dept.late_count) || 0,
          early_leave_count: parseInt(dept.early_leave_count) || 0,
          absent_count: parseInt(dept.absent_count) || 0
        };
      });
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        data: {
          total_employees: totalEmployees,
          attendance_rate: attendanceRate,
          late_count: lateCount,
          early_leave_count: earlyLeaveCount,
          absent_count: absentCount,
          overtime_hours: overtimeHours,
          department_stats: departmentStatsArray
        }
      };
    } catch (error) {
      console.error('获取考勤统计失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: '获取考勤统计失败'
      };
    }
  }
}

module.exports = AttendanceController;