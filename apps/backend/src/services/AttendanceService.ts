const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { Op } = require('sequelize');

// 考勤服务接口定义
interface AttendanceService {
  getAllAttendanceRecords: (options?: PaginationOptions & FilterOptions) => Promise<AttendanceListResult>;
  getAttendanceRecordById: (id: string | number) => Promise<AttendanceInstance | null>;
  createAttendanceRecord: (attendanceData: AttendanceCreateData) => Promise<AttendanceInstance>;
  updateAttendanceRecord: (id: string | number, attendanceData: AttendanceUpdateData) => Promise<AttendanceInstance | null>;
  deleteAttendanceRecord: (id: string | number) => Promise<boolean>;
  getAttendanceByEmployee: (employeeId: string | number, options?: PaginationOptions & DateFilterOptions) => Promise<AttendanceListResult>;
  getAttendanceByDateRange: (startDate: string | Date, endDate: string | Date, options?: PaginationOptions & FilterOptions) => Promise<AttendanceListResult>;
  getAttendanceSummary: (employeeId: string | number, startDate: string | Date, endDate: string | Date) => Promise<AttendanceSummary | null>;
  getMonthlyAttendanceReport: (departmentId?: string | number, year?: number, month?: number) => Promise<MonthlyAttendanceReport>;
  getLateAttendanceReport: (startDate: string | Date, endDate: string | Date, options?: PaginationOptions) => Promise<LateAttendanceReport>;
  calculateAttendanceStats: (startDate: string | Date, endDate: string | Date, departmentId?: string | number) => Promise<AttendanceStats>;
  markMultipleAttendances: (records: MultipleAttendanceData[]) => Promise<{ created: number; failed: number; errors: any[] }>;
  createLeaveApplication: (leaveData: LeaveApplicationData) => Promise<AttendanceInstance[]>;
  updateLeaveApplication: (id: string | number, status: string) => Promise<AttendanceInstance | null>;
  getEmployeeLeaveApplications: (employeeId: string | number, options?: PaginationOptions & DateFilterOptions) => Promise<AttendanceListResult>;
  reportExceptionalAttendance: (exceptionData: ExceptionalAttendanceData) => Promise<AttendanceInstance>;
  handleExceptionalAttendance: (id: string | number, resolutionData: ExceptionResolutionData) => Promise<AttendanceInstance | null>;
}

// 分页选项接口
interface PaginationOptions {
  page: number;
  pageSize: number;
}

// 过滤选项接口
interface FilterOptions {
  department_id?: string | number;
  status?: string;
  type?: string;
  employee_id?: string | number;
}

// 日期过滤选项接口
interface DateFilterOptions {
  startDate?: string | Date;
  endDate?: string | Date;
  month?: number;
  year?: number;
}

// 考勤列表结果接口
interface AttendanceListResult {
  records: AttendanceInstance[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

// 考勤创建数据接口
interface AttendanceCreateData {
  employee_id: string | number;
  date: string | Date;
  check_in_time?: string | Date;
  check_out_time?: string | Date;
  status: string;
  type?: string;
  notes?: string;
  created_by?: string | number;
}

// 考勤更新数据接口
interface AttendanceUpdateData {
  check_in_time?: string | Date;
  check_out_time?: string | Date;
  status?: string;
  type?: string;
  notes?: string;
  updated_by?: string | number;
}

// 多条考勤记录数据接口
interface MultipleAttendanceData {
  employee_id: string | number;
  date: string | Date;
  check_in_time?: string | Date;
  check_out_time?: string | Date;
  status: string;
  type?: string;
  notes?: string;
}

// 请假申请数据接口
interface LeaveApplicationData {
  employee_id: string | number;
  start_date: string | Date;
  end_date: string | Date;
  leave_type: 'Sick Leave' | 'Annual Leave' | 'Other Leave';
  reason: string;
  created_by?: string | number;
}

// 异常考勤数据接口
interface ExceptionalAttendanceData {
  employee_id: string | number;
  date: string | Date;
  reason: string;
  proof?: string; // 证明材料URL或描述
  created_by?: string | number;
}

// 异常考勤处理数据接口
interface ExceptionResolutionData {
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Exception';
  notes: string;
  updated_by?: string | number;
}

// 考勤实例类型
interface AttendanceInstance {
  id: string | number;
  employee_id: string | number;
  date: string | Date;
  check_in_time?: string | Date;
  check_out_time?: string | Date;
  status: string;
  type?: string;
  notes?: string;
  created_by?: string | number;
  updated_by?: string | number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // 实例方法
  calculateWorkingHours?: () => number;
  isLate?: () => boolean;
  getAttendanceStatus?: () => string;
}

// 员工实例类型
interface EmployeeInstance {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  department_id: string | number;
  position_id: string | number;
  status: string;
  // 其他属性...
}

// 考勤摘要接口
interface AttendanceSummary {
  employee: EmployeeInstance;
  period: {
    startDate: string;
    endDate: string;
  };
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  holidays: number;
  leaves: number;
  overtimeHours: number;
  regularHours: number;
  totalHours: number;
  attendanceRate: number;
  punctualityRate: number;
  records: AttendanceInstance[];
}

// 月度考勤报告接口
interface MonthlyAttendanceReport {
  departmentId?: string | number;
  year: number;
  month: number;
  departmentName?: string;
  totalEmployees: number;
  attendanceStats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    holidays: number;
    leaves: number;
  };
  employeeReports: EmployeeMonthlyReport[];
  departmentAttendanceRate: number;
  departmentPunctualityRate: number;
  averageHoursPerEmployee: number;
}

// 员工月度报告接口
interface EmployeeMonthlyReport {
  employee: EmployeeInstance;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaves: number;
  overtimeHours: number;
  regularHours: number;
  totalHours: number;
  attendanceRate: number;
  punctualityRate: number;
  records: AttendanceInstance[];
}

// 迟到考勤报告接口
interface LateAttendanceReport {
  records: LateAttendanceRecord[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  period: {
    startDate: string;
    endDate: string;
  };
  mostLateDepartmentId?: string | number;
  mostLateDepartmentName?: string;
  averageLateMinutes: number;
  maxLateMinutes: number;
}

// 迟到考勤记录接口
interface LateAttendanceRecord extends AttendanceInstance {
  employee: EmployeeInstance;
  departmentName?: string;
  positionName?: string;
  lateMinutes: number;
}

// 考勤统计接口
interface AttendanceStats {
  period: {
    startDate: string;
    endDate: string;
  };
  departmentId?: string | number;
  departmentName?: string;
  totalEmployees: number;
  totalDays: number;
  totalWorkingDays: number;
  attendanceSummary: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    holidays: number;
    leaves: number;
  };
  attendanceRates: {
    overall: number;
    byDepartment?: Array<{
      department_id: string | number;
      department_name: string;
      rate: number;
      totalEmployees: number;
    }>;
  };
  punctualityStats: {
    overallRate: number;
    averageLateMinutes: number;
    maxLateMinutes: number;
    mostLateEmployeeId?: string | number;
    mostLateEmployeeName?: string;
  };
  workingHoursStats: {
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    averageHoursPerEmployee: number;
    averageHoursPerDay: number;
  };
}

// 考勤服务实现
const AttendanceService: AttendanceService = {
  // 获取所有考勤记录
  async getAllAttendanceRecords(options?: PaginationOptions & FilterOptions): Promise<AttendanceListResult> {
    try {
      const where = {};
      
      // 应用过滤条件
      if (options) {
        if (options.department_id) {
          // 这需要使用嵌套查询或联合查询，这里简化处理
          const employees = await Employee.findAll({ where: { department_id: options.department_id }, attributes: ['id'] });
          const employeeIds = employees.map(emp => emp.id);
          where['employee_id'] = { [Op.in]: employeeIds };
        }
        if (options.status) {
          where['status'] = options.status;
        }
        if (options.type) {
          where['type'] = options.type;
        }
        if (options.employee_id) {
          where['employee_id'] = options.employee_id;
        }
      }
      
      if (options && options.page && options.pageSize) {
        const { page, pageSize } = options;
        const offset = (page - 1) * pageSize;
        
        const { count, rows } = await Attendance.findAndCountAll({
          where,
          include: [{ model: Employee, as: 'employee' }],
          offset,
          limit: pageSize,
          order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        
        return {
          records: rows,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        };
      } else {
        const records = await Attendance.findAll({
          where,
          include: [{ model: Employee, as: 'employee' }],
          order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });
        
        return {
          records,
          total: records.length
        };
      }
    } catch (error) {
      console.error('Error getting all attendance records:', error);
      throw error;
    }
  },
  
  // 根据ID获取考勤记录
  async getAttendanceRecordById(id: string | number): Promise<AttendanceInstance | null> {
    try {
      return await Attendance.findByPk(id, {
        include: [{ model: Employee, as: 'employee' }]
      });
    } catch (error) {
      console.error(`Error getting attendance record with id ${id}:`, error);
      throw error;
    }
  },
  
  // 创建新考勤记录
  async createAttendanceRecord(attendanceData: AttendanceCreateData): Promise<AttendanceInstance> {
    try {
      // 检查员工是否存在
      const employee = await Employee.findByPk(attendanceData.employee_id);
      if (!employee) {
        throw new Error('Employee does not exist');
      }
      
      // 检查是否已存在该员工当天的考勤记录
      const existingRecord = await Attendance.findOne({
        where: {
          employee_id: attendanceData.employee_id,
          date: attendanceData.date
        }
      });
      
      if (existingRecord) {
        throw new Error('Attendance record already exists for this employee on the specified date');
      }
      
      // 设置默认值
      const data = {
        ...attendanceData,
        type: attendanceData.type || 'Regular'
      };
      
      return await Attendance.create(data);
    } catch (error) {
      console.error('Error creating attendance record:', error);
      throw error;
    }
  },
  
  // 更新考勤记录
  async updateAttendanceRecord(id: string | number, attendanceData: AttendanceUpdateData): Promise<AttendanceInstance | null> {
    try {
      const record = await Attendance.findByPk(id);
      
      if (!record) {
        return null;
      }
      
      // 检查打卡时间逻辑
      if (attendanceData.check_in_time && attendanceData.check_out_time) {
        const checkIn = new Date(attendanceData.check_in_time);
        const checkOut = new Date(attendanceData.check_out_time);
        
        if (checkIn >= checkOut) {
          throw new Error('Check-in time must be before check-out time');
        }
      } else if (attendanceData.check_in_time && record.check_out_time) {
        const checkIn = new Date(attendanceData.check_in_time);
        const checkOut = new Date(record.check_out_time);
        
        if (checkIn >= checkOut) {
          throw new Error('Check-in time must be before check-out time');
        }
      } else if (attendanceData.check_out_time && record.check_in_time) {
        const checkIn = new Date(record.check_in_time);
        const checkOut = new Date(attendanceData.check_out_time);
        
        if (checkIn >= checkOut) {
          throw new Error('Check-in time must be before check-out time');
        }
      }
      
      await record.update(attendanceData);
      
      // 返回更新后的记录，包括关联数据
      return await this.getAttendanceRecordById(id);
    } catch (error) {
      console.error(`Error updating attendance record with id ${id}:`, error);
      throw error;
    }
  },
  
  // 删除考勤记录
  async deleteAttendanceRecord(id: string | number): Promise<boolean> {
    try {
      const record = await Attendance.findByPk(id);
      
      if (!record) {
        return false;
      }
      
      await record.destroy();
      return true;
    } catch (error) {
      console.error(`Error deleting attendance record with id ${id}:`, error);
      throw error;
    }
  },
  
  // 根据员工获取考勤记录
  async getAttendanceByEmployee(employeeId: string | number, options?: PaginationOptions & DateFilterOptions): Promise<AttendanceListResult> {
    try {
      // 检查员工是否存在
      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        throw new Error('Employee does not exist');
      }
      
      const where: any = { employee_id: employeeId };
      
      // 应用日期过滤
      if (options) {
        if (options.startDate) {
          where['date'] = { [Op.gte]: options.startDate };
        }
        if (options.endDate) {
          where['date'] = {
            ...where['date'],
            [Op.lte]: options.endDate
          };
        }
        if (options.year && options.month !== undefined) {
          // 构建月份的开始和结束日期
          const startDate = new Date(options.year, options.month - 1, 1);
          const endDate = new Date(options.year, options.month, 0);
          
          where['date'] = { [Op.between]: [startDate, endDate] };
        } else if (options.year) {
          // 全年查询
          const startDate = new Date(options.year, 0, 1);
          const endDate = new Date(options.year, 11, 31);
          
          where['date'] = { [Op.between]: [startDate, endDate] };
        }
      }
      
      if (options && options.page && options.pageSize) {
        const { page, pageSize } = options;
        const offset = (page - 1) * pageSize;
        
        const { count, rows } = await Attendance.findAndCountAll({
          where,
          include: [{ model: Employee, as: 'employee' }],
          offset,
          limit: pageSize,
          order: [['date', 'DESC']]
        });
        
        return {
          records: rows,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        };
      } else {
        const records = await Attendance.findAll({
          where,
          include: [{ model: Employee, as: 'employee' }],
          order: [['date', 'DESC']]
        });
        
        return {
          records,
          total: records.length
        };
      }
    } catch (error) {
      console.error(`Error getting attendance records for employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  // 根据日期范围获取考勤记录
  async getAttendanceByDateRange(startDate: string | Date, endDate: string | Date, options?: PaginationOptions & FilterOptions): Promise<AttendanceListResult> {
    try {
      const where: any = {
        date: { [Op.between]: [startDate, endDate] }
      };
      
      // 应用额外的过滤条件
      if (options) {
        if (options.department_id) {
          const employees = await Employee.findAll({ where: { department_id: options.department_id }, attributes: ['id'] });
          const employeeIds = employees.map(emp => emp.id);
          where['employee_id'] = { [Op.in]: employeeIds };
        }
        if (options.status) {
          where['status'] = options.status;
        }
        if (options.type) {
          where['type'] = options.type;
        }
        if (options.employee_id) {
          where['employee_id'] = options.employee_id;
        }
      }
      
      if (options && options.page && options.pageSize) {
        const { page, pageSize } = options;
        const offset = (page - 1) * pageSize;
        
        const { count, rows } = await Attendance.findAndCountAll({
          where,
          include: [{ model: Employee, as: 'employee' }],
          offset,
          limit: pageSize,
          order: [['date', 'DESC'], ['employee_id', 'ASC']]
        });
        
        return {
          records: rows,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        };
      } else {
        const records = await Attendance.findAll({
          where,
          include: [{ model: Employee, as: 'employee' }],
          order: [['date', 'DESC'], ['employee_id', 'ASC']]
        });
        
        return {
          records,
          total: records.length
        };
      }
    } catch (error) {
      console.error('Error getting attendance records by date range:', error);
      throw error;
    }
  },
  
  // 获取员工考勤摘要
  async getAttendanceSummary(employeeId: string | number, startDate: string | Date, endDate: string | Date): Promise<AttendanceSummary | null> {
    try {
      // 检查员工是否存在
      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        return null;
      }
      
      // 获取该时间段内的考勤记录
      const records = await Attendance.findAll({
        where: {
          employee_id: employeeId,
          date: { [Op.between]: [startDate, endDate] }
        },
        order: [['date', 'ASC']]
      });
      
      // 统计各类考勤天数
      const attendanceStats = {
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        halfDays: 0,
        holidays: 0,
        leaves: 0
      };
      
      let totalHours = 0;
      let regularHours = 0;
      let overtimeHours = 0;
      
      records.forEach(record => {
        switch (record.status) {
          case 'Present':
            attendanceStats.presentDays++;
            // 计算工作时间
            if (record.check_in_time && record.check_out_time) {
              const workingHours = this.calculateWorkingHours(record);
              totalHours += workingHours;
              
              // 假设标准工作时间为8小时
              const standardHours = 8;
              if (workingHours <= standardHours) {
                regularHours += workingHours;
              } else {
                regularHours += standardHours;
                overtimeHours += workingHours - standardHours;
              }
              
              // 检查是否迟到（假设9:00为上班时间）
              if (this.isLate(record)) {
                attendanceStats.lateDays++;
              }
            }
            break;
          case 'Absent':
            attendanceStats.absentDays++;
            break;
          case 'Half Day':
            attendanceStats.halfDays++;
            regularHours += 4; // 半天工作时间
            break;
          case 'Holiday':
            attendanceStats.holidays++;
            break;
          case 'Leave':
            attendanceStats.leaves++;
            break;
        }
      });
      
      // 计算总天数（包括工作日和非工作日）
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // 计算出勤率和准时率
      const workingDays = totalDays - attendanceStats.holidays;
      const attendanceRate = workingDays > 0 ? ((attendanceStats.presentDays + attendanceStats.halfDays) / workingDays) * 100 : 0;
      const punctualityRate = attendanceStats.presentDays > 0 ? ((attendanceStats.presentDays - attendanceStats.lateDays) / attendanceStats.presentDays) * 100 : 0;
      
      return {
        employee,
        period: {
          startDate: startDate.toString(),
          endDate: endDate.toString()
        },
        totalDays,
        ...attendanceStats,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        regularHours: Math.round(regularHours * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        punctualityRate: Math.round(punctualityRate * 100) / 100,
        records
      };
    } catch (error) {
      console.error(`Error getting attendance summary for employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  // 获取月度考勤报告
  async getMonthlyAttendanceReport(departmentId?: string | number, year?: number, month?: number): Promise<MonthlyAttendanceReport> {
    try {
      const currentYear = year || new Date().getFullYear();
      const currentMonth = month || new Date().getMonth() + 1;
      
      // 构建月份的开始和结束日期
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      
      // 获取员工列表
      const employeeWhere = {};
      if (departmentId) {
        employeeWhere['department_id'] = departmentId;
      }
      
      const employees = await Employee.findAll({
        where: { ...employeeWhere, status: 'Active' }
      });
      
      let departmentName;
      if (departmentId) {
        // 这里简化处理，实际应该从Department模型获取
        departmentName = `Department ${departmentId}`;
      }
      
      // 获取所有员工的考勤记录
      const employeeReports: EmployeeMonthlyReport[] = [];
      const overallStats = {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        halfDays: 0,
        holidays: 0,
        leaves: 0
      };
      
      let totalHoursAllEmployees = 0;
      
      for (const employee of employees) {
        const summary = await this.getAttendanceSummary(employee.id, startDate, endDate);
        
        if (summary) {
          employeeReports.push({
            employee: summary.employee,
            presentDays: summary.presentDays,
            absentDays: summary.absentDays,
            lateDays: summary.lateDays,
            halfDays: summary.halfDays,
            leaves: summary.leaves,
            overtimeHours: summary.overtimeHours,
            regularHours: summary.regularHours,
            totalHours: summary.totalHours,
            attendanceRate: summary.attendanceRate,
            punctualityRate: summary.punctualityRate,
            records: summary.records
          });
          
          // 累计总体统计
          overallStats.presentDays += summary.presentDays;
          overallStats.absentDays += summary.absentDays;
          overallStats.lateDays += summary.lateDays;
          overallStats.halfDays += summary.halfDays;
          overallStats.holidays += summary.holidays;
          overallStats.leaves += summary.leaves;
          totalHoursAllEmployees += summary.totalHours;
        }
      }
      
      // 计算部门出勤率和准时率
      const totalWorkingDays = employees.length * ((endDate.getDate())); // 简化计算
      const departmentAttendanceRate = totalWorkingDays > 0 ? 
        ((overallStats.presentDays + overallStats.halfDays) / totalWorkingDays) * 100 : 0;
      
      const totalPresentDays = overallStats.presentDays;
      const departmentPunctualityRate = totalPresentDays > 0 ? 
        ((totalPresentDays - overallStats.lateDays) / totalPresentDays) * 100 : 0;
      
      const averageHoursPerEmployee = employees.length > 0 ? 
        totalHoursAllEmployees / employees.length : 0;
      
      return {
        departmentId,
        year: currentYear,
        month: currentMonth,
        departmentName,
        totalEmployees: employees.length,
        attendanceStats: overallStats,
        employeeReports,
        departmentAttendanceRate: Math.round(departmentAttendanceRate * 100) / 100,
        departmentPunctualityRate: Math.round(departmentPunctualityRate * 100) / 100,
        averageHoursPerEmployee: Math.round(averageHoursPerEmployee * 100) / 100
      };
    } catch (error) {
      console.error('Error getting monthly attendance report:', error);
      throw error;
    }
  },
  
  // 获取迟到考勤报告
  async getLateAttendanceReport(startDate: string | Date, endDate: string | Date, options?: PaginationOptions): Promise<LateAttendanceReport> {
    try {
      // 获取该时间段内所有考勤记录
      const records = await Attendance.findAll({
        where: {
          date: { [Op.between]: [startDate, endDate] },
          status: 'Present',
          check_in_time: { [Op.ne]: null }
        },
        include: [{ model: Employee, as: 'employee' }]
      });
      
      // 筛选迟到记录
      const lateRecords: LateAttendanceRecord[] = [];
      let totalLateMinutes = 0;
      let maxLateMinutes = 0;
      const departmentLateCount: { [key: string]: number } = {};
      
      records.forEach(record => {
        if (this.isLate(record)) {
          const lateMinutes = this.calculateLateMinutes(record);
          totalLateMinutes += lateMinutes;
          maxLateMinutes = Math.max(maxLateMinutes, lateMinutes);
          
          // 记录部门迟到次数
          if (record.employee && record.employee.department_id) {
            const deptId = record.employee.department_id.toString();
            departmentLateCount[deptId] = (departmentLateCount[deptId] || 0) + 1;
          }
          
          lateRecords.push({
            ...record.toJSON(),
            employee: record.employee,
            lateMinutes
          });
        }
      });
      
      // 找出迟到次数最多的部门
      let mostLateDepartmentId = null;
      let mostLateDepartmentName = null;
      let maxCount = 0;
      
      Object.entries(departmentLateCount).forEach(([deptId, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostLateDepartmentId = deptId;
          mostLateDepartmentName = `Department ${deptId}`; // 简化处理
        }
      });
      
      // 计算平均迟到时间
      const averageLateMinutes = lateRecords.length > 0 ? totalLateMinutes / lateRecords.length : 0;
      
      // 应用分页
      if (options && options.page && options.pageSize) {
        const { page, pageSize } = options;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedRecords = lateRecords.slice(startIndex, endIndex);
        
        return {
          records: paginatedRecords,
          total: lateRecords.length,
          page,
          pageSize,
          totalPages: Math.ceil(lateRecords.length / pageSize),
          period: {
            startDate: startDate.toString(),
            endDate: endDate.toString()
          },
          mostLateDepartmentId,
          mostLateDepartmentName,
          averageLateMinutes: Math.round(averageLateMinutes * 100) / 100,
          maxLateMinutes
        };
      }
      
      return {
        records: lateRecords,
        total: lateRecords.length,
        period: {
          startDate: startDate.toString(),
          endDate: endDate.toString()
        },
        mostLateDepartmentId,
        mostLateDepartmentName,
        averageLateMinutes: Math.round(averageLateMinutes * 100) / 100,
        maxLateMinutes
      };
    } catch (error) {
      console.error('Error getting late attendance report:', error);
      throw error;
    }
  },
  
  // 计算考勤统计信息
  async calculateAttendanceStats(startDate: string | Date, endDate: string | Date, departmentId?: string | number): Promise<AttendanceStats> {
    try {
      // 获取员工列表
      const employeeWhere = {};
      if (departmentId) {
        employeeWhere['department_id'] = departmentId;
      }
      
      const employees = await Employee.findAll({
        where: { ...employeeWhere, status: 'Active' }
      });
      
      // 收集所有考勤记录
      let allRecords = [];
      let totalHours = 0;
      let regularHours = 0;
      let overtimeHours = 0;
      let totalLateMinutes = 0;
      let maxLateMinutes = 0;
      let mostLateEmployeeId = null;
      let mostLateEmployeeName = null;
      
      // 按部门分组的统计
      const departmentStats: { [key: string]: { department_id: string | number; department_name: string; presentDays: number; workingDays: number; employeeCount: number } } = {};
      
      for (const employee of employees) {
        const summary = await this.getAttendanceSummary(employee.id, startDate, endDate);
        
        if (summary) {
          allRecords = [...allRecords, ...summary.records];
          totalHours += summary.totalHours;
          regularHours += summary.regularHours;
          overtimeHours += summary.overtimeHours;
          
          // 统计部门数据
          const deptId = employee.department_id.toString();
          if (!departmentStats[deptId]) {
            departmentStats[deptId] = {
              department_id: employee.department_id,
              department_name: `Department ${employee.department_id}`, // 简化处理
              presentDays: 0,
              workingDays: 0,
              employeeCount: 0
            };
          }
          
          departmentStats[deptId].presentDays += summary.presentDays + summary.halfDays;
          departmentStats[deptId].workingDays += summary.totalDays - summary.holidays;
          departmentStats[deptId].employeeCount++;
          
          // 检查员工是否有迟到记录并更新相关统计
          const lateRecords = summary.records.filter(r => this.isLate(r));
          for (const record of lateRecords) {
            const lateMinutes = this.calculateLateMinutes(record);
            totalLateMinutes += lateMinutes;
            
            if (lateMinutes > maxLateMinutes) {
              maxLateMinutes = lateMinutes;
              mostLateEmployeeId = employee.id;
              mostLateEmployeeName = `${employee.first_name} ${employee.last_name}`;
            }
          }
        }
      }
      
      // 计算总体统计数据
      const attendanceSummary = allRecords.reduce((stats, record) => {
        switch (record.status) {
          case 'Present':
            stats.presentDays++;
            break;
          case 'Absent':
            stats.absentDays++;
            break;
          case 'Half Day':
            stats.halfDays++;
            break;
          case 'Holiday':
            stats.holidays++;
            break;
          case 'Leave':
            stats.leaves++;
            break;
        }
        return stats;
      }, {
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        halfDays: 0,
        holidays: 0,
        leaves: 0
      });
      
      // 计算总体出勤率
      const totalWorkingDays = allRecords.length - attendanceSummary.holidays;
      const overallAttendanceRate = totalWorkingDays > 0 ? 
        ((attendanceSummary.presentDays + attendanceSummary.halfDays) / totalWorkingDays) * 100 : 0;
      
      // 计算准时率
      const lateRecordsCount = allRecords.filter(r => r.status === 'Present' && this.isLate(r)).length;
      const overallPunctualityRate = attendanceSummary.presentDays > 0 ? 
        ((attendanceSummary.presentDays - lateRecordsCount) / attendanceSummary.presentDays) * 100 : 0;
      
      // 计算平均迟到时间
      const averageLateMinutes = lateRecordsCount > 0 ? totalLateMinutes / lateRecordsCount : 0;
      
      // 计算按部门的出勤率
      const byDepartmentAttendanceRates = Object.values(departmentStats).map(dept => ({
        department_id: dept.department_id,
        department_name: dept.department_name,
        rate: dept.workingDays > 0 ? (dept.presentDays / dept.workingDays) * 100 : 0,
        totalEmployees: dept.employeeCount
      }));
      
      // 计算平均工作时间
      const averageHoursPerEmployee = employees.length > 0 ? totalHours / employees.length : 0;
      const averageHoursPerDay = totalWorkingDays > 0 ? totalHours / totalWorkingDays : 0;
      
      let departmentName;
      if (departmentId) {
        departmentName = `Department ${departmentId}`; // 简化处理
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      return {
        period: {
          startDate: startDate.toString(),
          endDate: endDate.toString()
        },
        departmentId,
        departmentName,
        totalEmployees: employees.length,
        totalDays,
        totalWorkingDays,
        attendanceSummary,
        attendanceRates: {
          overall: Math.round(overallAttendanceRate * 100) / 100,
          byDepartment: departmentId ? undefined : byDepartmentAttendanceRates
        },
        punctualityStats: {
          overallRate: Math.round(overallPunctualityRate * 100) / 100,
          averageLateMinutes: Math.round(averageLateMinutes * 100) / 100,
          maxLateMinutes,
          mostLateEmployeeId,
          mostLateEmployeeName
        },
        workingHoursStats: {
          totalHours: Math.round(totalHours * 100) / 100,
          regularHours: Math.round(regularHours * 100) / 100,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          averageHoursPerEmployee: Math.round(averageHoursPerEmployee * 100) / 100,
          averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100
        }
      };
    } catch (error) {
      console.error('Error calculating attendance stats:', error);
      throw error;
    }
  },
  
  // 批量标记考勤
  async markMultipleAttendances(records: MultipleAttendanceData[]): Promise<{ created: number; failed: number; errors: any[] }> {
    try {
      let created = 0;
      let failed = 0;
      const errors = [];
      
      for (const recordData of records) {
        try {
          // 检查员工是否存在
          const employee = await Employee.findByPk(recordData.employee_id);
          if (!employee) {
            throw new Error(`Employee with id ${recordData.employee_id} does not exist`);
          }
          
          // 检查是否已存在该员工当天的考勤记录
          const existingRecord = await Attendance.findOne({
            where: {
              employee_id: recordData.employee_id,
              date: recordData.date
            }
          });
          
          if (existingRecord) {
            throw new Error(`Attendance record already exists for employee ${recordData.employee_id} on ${recordData.date}`);
          }
          
          // 创建记录
          await Attendance.create({
            ...recordData,
            type: recordData.type || 'Regular'
          });
          
          created++;
        } catch (error) {
          failed++;
          errors.push({
            employee_id: recordData.employee_id,
            date: recordData.date,
            error: error.message
          });
        }
      }
      
      return { created, failed, errors };
    } catch (error) {
      console.error('Error marking multiple attendances:', error);
      throw error;
    }
  },

  // 创建请假申请
  async createLeaveApplication(leaveData: LeaveApplicationData): Promise<AttendanceInstance[]> {
    try {
      // 检查员工是否存在
      const employee = await Employee.findByPk(leaveData.employee_id);
      if (!employee) {
        throw new Error('Employee does not exist');
      }

      // 检查日期范围
      const startDate = new Date(leaveData.start_date);
      const endDate = new Date(leaveData.end_date);
      
      if (startDate > endDate) {
        throw new Error('Start date must be before end date');
      }

      // 创建请假记录
      const leaveRecords = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // 检查是否已存在该员工当天的考勤记录
        const existingRecord = await Attendance.findOne({
          where: {
            employee_id: leaveData.employee_id,
            date: currentDate.toISOString().split('T')[0]
          }
        });
        
        if (existingRecord) {
          throw new Error(`Attendance record already exists for ${currentDate.toISOString().split('T')[0]}`);
        }

        // 创建请假记录
        const leaveRecord = await Attendance.create({
          employee_id: leaveData.employee_id,
          date: currentDate.toISOString().split('T')[0],
          status: leaveData.leave_type,
          notes: leaveData.reason,
          created_by: leaveData.created_by
        });
        
        leaveRecords.push(leaveRecord);
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return leaveRecords;
    } catch (error) {
      console.error('Error creating leave application:', error);
      throw error;
    }
  },

  // 更新请假申请
  async updateLeaveApplication(id: string | number, status: string): Promise<AttendanceInstance | null> {
    try {
      const record = await Attendance.findByPk(id);
      
      if (!record) {
        return null;
      }
      
      // 只有请假类型的记录才能更新状态
      if (!['Sick Leave', 'Annual Leave', 'Other Leave'].includes(record.status)) {
        throw new Error('Only leave records can be updated');
      }
      
      await record.update({ status });
      
      return record;
    } catch (error) {
      console.error(`Error updating leave application with id ${id}:`, error);
      throw error;
    }
  },

  // 获取员工请假记录
  async getEmployeeLeaveApplications(employeeId: string | number, options?: PaginationOptions & DateFilterOptions): Promise<AttendanceListResult> {
    try {
      // 检查员工是否存在
      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        throw new Error('Employee does not exist');
      }
      
      const where: any = {
        employee_id: employeeId,
        status: { [Op.in]: ['Sick Leave', 'Annual Leave', 'Other Leave'] }
      };
      
      // 应用日期过滤
      if (options) {
        if (options.startDate) {
          where['date'] = { [Op.gte]: options.startDate };
        }
        if (options.endDate) {
          where['date'] = {
            ...where['date'],
            [Op.lte]: options.endDate
          };
        }
      }
      
      if (options && options.page && options.pageSize) {
        const { page, pageSize } = options;
        const offset = (page - 1) * pageSize;
        
        const { count, rows } = await Attendance.findAndCountAll({
          where,
          include: [{ model: Employee, as: 'employee' }],
          offset,
          limit: pageSize,
          order: [['date', 'DESC']]
        });
        
        return {
          records: rows,
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        };
      } else {
        const records = await Attendance.findAll({
          where,
          include: [{ model: Employee, as: 'employee' }],
          order: [['date', 'DESC']]
        });
        
        return {
          records,
          total: records.length
        };
      }
    } catch (error) {
      console.error(`Error getting leave applications for employee ${employeeId}:`, error);
      throw error;
    }
  },

  // 上报异常考勤
  async reportExceptionalAttendance(exceptionData: ExceptionalAttendanceData): Promise<AttendanceInstance> {
    try {
      // 检查员工是否存在
      const employee = await Employee.findByPk(exceptionData.employee_id);
      if (!employee) {
        throw new Error('Employee does not exist');
      }
      
      // 检查是否已存在该员工当天的考勤记录
      const existingRecord = await Attendance.findOne({
        where: {
          employee_id: exceptionData.employee_id,
          date: exceptionData.date
        }
      });
      
      if (existingRecord) {
        // 如果已存在记录，更新为异常状态
        return await existingRecord.update({
          status: 'Exception',
          notes: exceptionData.reason,
          updated_by: exceptionData.created_by
        });
      } else {
        // 如果不存在记录，创建新的异常记录
        return await Attendance.create({
          employee_id: exceptionData.employee_id,
          date: exceptionData.date,
          status: 'Exception',
          notes: exceptionData.reason,
          created_by: exceptionData.created_by
        });
      }
    } catch (error) {
      console.error('Error reporting exceptional attendance:', error);
      throw error;
    }
  },

  // 处理异常考勤
  async handleExceptionalAttendance(id: string | number, resolutionData: ExceptionResolutionData): Promise<AttendanceInstance | null> {
    try {
      const record = await Attendance.findByPk(id);
      
      if (!record) {
        return null;
      }
      
      // 只有异常类型的记录才能处理
      if (record.status !== 'Exception') {
        throw new Error('Only exception records can be handled');
      }
      
      await record.update({
        status: resolutionData.status,
        notes: resolutionData.notes,
        updated_by: resolutionData.updated_by
      });
      
      return record;
    } catch (error) {
      console.error(`Error handling exceptional attendance with id ${id}:`, error);
      throw error;
    }
  },
  
  // 辅助方法：计算工作时间
  private calculateWorkingHours(record: AttendanceInstance): number {
    if (!record.check_in_time || !record.check_out_time) {
      return 0;
    }
    
    const checkIn = new Date(record.check_in_time);
    const checkOut = new Date(record.check_out_time);
    
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours * 100) / 100;
  },
  
  // 辅助方法：判断是否迟到（假设9:00为上班时间）
  private isLate(record: AttendanceInstance): boolean {
    if (!record.check_in_time || record.status !== 'Present') {
      return false;
    }
    
    const checkIn = new Date(record.check_in_time);
    const checkInHour = checkIn.getHours();
    const checkInMinute = checkIn.getMinutes();
    
    // 9:00 之后视为迟到
    return checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0);
  },
  
  // 辅助方法：计算迟到分钟数
  private calculateLateMinutes(record: AttendanceInstance): number {
    if (!record.check_in_time || record.status !== 'Present' || !this.isLate(record)) {
      return 0;
    }
    
    const checkIn = new Date(record.check_in_time);
    const expectedTime = new Date(record.check_in_time);
    expectedTime.setHours(9, 0, 0, 0); // 9:00 AM
    
    const diffMs = checkIn.getTime() - expectedTime.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    
    return Math.round(diffMinutes);
  }
};

module.exports = AttendanceService;