const { Employee, Department, Position, Salary, sequelize } = require('../models');
const { Op } = require('sequelize');
const winston = require('../utils/logger');

class EmployeeService {
  // 员工调动服务（部门和职位同时变更）
  static async transferEmployee(employeeId, newDepartmentId, newPositionId, effectiveDate = new Date()) {
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      // 检查员工是否存在
      const employee = await Employee.findByPk(employeeId, {
        include: [
          { model: Department, as: 'department' },
          { model: Position, as: 'position' }
        ],
        transaction
      });
      
      if (!employee) {
        throw new Error('员工不存在');
      }
      
      // 检查新部门是否存在
      const newDepartment = await Department.findByPk(newDepartmentId, { transaction });
      if (!newDepartment) {
        throw new Error('新部门不存在');
      }
      
      // 检查新职位是否存在
      const newPosition = await Position.findByPk(newPositionId, { transaction });
      if (!newPosition) {
        throw new Error('新职位不存在');
      }
      
      // 记录调动前的信息
      const oldDepartmentId = employee.department_id;
      const oldPositionId = employee.position_id;
      
      // 更新员工的部门和职位
      await employee.update({
        department_id: newDepartmentId,
        position_id: newPositionId
      }, { transaction });
      
      // 记录调动日志
      winston.info(`员工调动记录: 员工ID ${employeeId} 从 ${employee.department?.department_name || '无部门'}(${oldDepartmentId})/${employee.position?.position_name || '无职位'}(${oldPositionId}) 调至 ${newDepartment.department_name}(${newDepartmentId})/${newPosition.position_name}(${newPositionId})`);
      
      // 提交事务
      await transaction.commit();
      
      return {
        success: true,
        message: '员工调动成功',
        data: {
          employeeId,
          oldDepartment: employee.department,
          oldPosition: employee.position,
          newDepartment,
          newPosition,
          effectiveDate
        }
      };
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      winston.error('员工调动失败:', error);
      throw error;
    }
  }

  // 薪资调整服务
  static async adjustSalary(employeeId, newSalaryData) {
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      // 检查员工是否存在
      const employee = await Employee.findByPk(employeeId, { transaction });
      if (!employee) {
        throw new Error('员工不存在');
      }
      
      // 获取当前薪资
      const currentSalary = await Salary.findOne({
        where: { employee_id: employeeId },
        transaction
      });
      
      const oldSalaryInfo = currentSalary ? {
        basicSalary: currentSalary.basic_salary,
        bonus: currentSalary.bonus,
        allowances: currentSalary.allowances,
        totalSalary: currentSalary.getTotalSalary()
      } : null;
      
      // 更新或创建薪资记录
      if (currentSalary) {
        await currentSalary.update(newSalaryData, { transaction });
      } else {
        await Salary.create({
          employee_id: employeeId,
          ...newSalaryData
        }, { transaction });
      }
      
      // 获取更新后的薪资
      const updatedSalary = await Salary.findOne({
        where: { employee_id: employeeId },
        transaction
      });
      
      const newSalaryInfo = {
        basicSalary: updatedSalary.basic_salary,
        bonus: updatedSalary.bonus,
        allowances: updatedSalary.allowances,
        totalSalary: updatedSalary.getTotalSalary()
      };
      
      // 记录薪资调整日志
      winston.info(`薪资调整记录: 员工ID ${employeeId} ${employee.getFullName()} 从 ${oldSalaryInfo ? oldSalaryInfo.totalSalary : 0} 调整至 ${newSalaryInfo.totalSalary}`);
      
      // 提交事务
      await transaction.commit();
      
      return {
        success: true,
        message: '薪资调整成功',
        data: {
          employeeId,
          oldSalary: oldSalaryInfo,
          newSalary: newSalaryInfo,
          effectiveDate: updatedSalary.effective_date
        }
      };
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      winston.error('薪资调整失败:', error);
      throw error;
    }
  }

  // 批量员工导入服务
  static async batchImportEmployees(employeesData) {
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      for (let i = 0; i < employeesData.length; i++) {
        const employeeData = employeesData[i];
        
        try {
          // 检查邮箱是否已存在
          const existingEmployee = await Employee.findOne({
            where: { email: employeeData.email },
            transaction
          });
          
          if (existingEmployee) {
            throw new Error('邮箱已存在');
          }
          
          // 创建员工
          const employee = await Employee.create(employeeData, { transaction });
          
          // 如果有薪资信息，创建薪资记录
          if (employeeData.salary) {
            await Salary.create({
              employee_id: employee.employee_id,
              ...employeeData.salary
            }, { transaction });
          }
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: error.message,
            data: employeeData
          });
          
          // 记录具体错误，但继续处理其他员工
          winston.error(`批量导入第 ${i + 1} 行失败:`, error);
        }
      }
      
      // 提交事务
      await transaction.commit();
      
      return {
        success: true,
        message: `批量导入完成: 成功 ${results.success} 条，失败 ${results.failed} 条`,
        data: results
      };
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      winston.error('批量员工导入失败:', error);
      throw error;
    }
  }

  // 获取员工统计报表
  static async getEmployeeStatistics(filters = {}) {
    try {
      const whereClause = {};
      
      // 应用过滤条件
      if (filters.department_id) {
        whereClause.department_id = filters.department_id;
      }
      if (filters.position_id) {
        whereClause.position_id = filters.position_id;
      }
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.hire_date_start && filters.hire_date_end) {
        whereClause.hire_date = {
          [Op.between]: [filters.hire_date_start, filters.hire_date_end]
        };
      }
      
      // 基础统计
      const totalEmployees = await Employee.count({ where: whereClause });
      const activeEmployees = await Employee.count({ 
        where: { ...whereClause, status: 'active' }
      });
      
      // 按部门统计
      const departmentStats = await Employee.findAll({
        attributes: [
          'department_id',
          [sequelize.fn('COUNT', sequelize.col('employee_id')), 'count']
        ],
        where: whereClause,
        group: ['department_id'],
        raw: true
      });
      
      // 按职位统计
      const positionStats = await Employee.findAll({
        attributes: [
          'position_id',
          [sequelize.fn('COUNT', sequelize.col('employee_id')), 'count']
        ],
        where: whereClause,
        group: ['position_id'],
        raw: true
      });
      
      // 薪资统计
      const salaryStats = await sequelize.query(`
        SELECT 
          AVG(s.basic_salary) as avg_basic_salary,
          MAX(s.basic_salary) as max_basic_salary,
          MIN(s.basic_salary) as min_basic_salary,
          AVG(s.basic_salary + s.bonus + s.allowances) as avg_total_salary
        FROM 
          employees e
        LEFT JOIN 
          salaries s ON e.employee_id = s.employee_id
        WHERE 
          ${Object.keys(whereClause).length > 0 ? 
            Object.entries(whereClause).map(([key, value]) => {
              if (key === 'hire_date' && typeof value === 'object') {
                return `e.hire_date BETWEEN '${value[Op.between][0]}' AND '${value[Op.between][1]}'`;
              }
              return `e.${key} = '${value}'`;
            }).join(' AND ') 
          : '1=1'}
      `, { type: sequelize.QueryTypes.SELECT });
      
      return {
        success: true,
        data: {
          totalEmployees,
          activeEmployees,
          departmentStats,
          positionStats,
          salaryStats: salaryStats[0],
          filters
        }
      };
    } catch (error) {
      winston.error('获取员工统计报表失败:', error);
      throw error;
    }
  }

  // 员工离职处理
  static async processEmployeeResignation(employeeId, resignationDate = new Date(), reason = '') {
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      // 检查员工是否存在
      const employee = await Employee.findByPk(employeeId, { transaction });
      if (!employee) {
        throw new Error('员工不存在');
      }
      
      // 检查员工是否已经离职
      if (employee.status === 'resigned') {
        throw new Error('员工已经处于离职状态');
      }
      
      // 记录离职前的信息
      const previousStatus = employee.status;
      const departmentId = employee.department_id;
      const positionId = employee.position_id;
      
      // 更新员工状态为离职
      await employee.update({
        status: 'resigned'
      }, { transaction });
      
      // 记录离职日志
      winston.info(`员工离职记录: 员工ID ${employeeId} ${employee.getFullName()} 于 ${resignationDate} 离职，原因: ${reason || '未提供'}`);
      
      // 提交事务
      await transaction.commit();
      
      return {
        success: true,
        message: '员工离职处理成功',
        data: {
          employeeId,
          employeeName: employee.getFullName(),
          previousStatus,
          resignationDate,
          reason,
          departmentId,
          positionId
        }
      };
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      winston.error('员工离职处理失败:', error);
      throw error;
    }
  }
}

module.exports = EmployeeService;