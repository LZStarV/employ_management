import Router from 'koa-router';
import AttendanceController from '../controllers/AttendanceController';

const router = new Router({
  prefix: '/api/attendances'
});

/**
 * 考勤相关路由
 * 只保留三个核心接口，用于查看其他员工的考勤情况
 */

/**
 * @route GET /api/attendances
 * @description 获取员工考勤列表
 * @access 需认证
 * @params page: 页码，默认1
 * @params pageSize: 每页数量，默认20
 * @params startDate: 开始日期，格式YYYY-MM-DD
 * @params endDate: 结束日期，格式YYYY-MM-DD
 * @params departmentId: 部门ID（可选）
 */
router.get('/', AttendanceController.getAttendanceList);

/**
 * @route GET /api/attendances/employee/:employeeId
 * @description 获取指定员工的考勤详情
 * @access 需认证
 * @params employeeId: 员工ID
 * @params startDate: 开始日期，格式YYYY-MM-DD
 * @params endDate: 结束日期，格式YYYY-MM-DD
 */
router.get('/employee/:employeeId', AttendanceController.getEmployeeAttendanceDetail);

/**
 * @route GET /api/attendances/statistics
 * @description 获取考勤统计信息
 * @access 需认证
 * @params startDate: 开始日期，格式YYYY-MM-DD
 * @params endDate: 结束日期，格式YYYY-MM-DD
 * @params departmentId: 部门ID（可选）
 */
router.get('/statistics', AttendanceController.getAttendanceStatistics);

/**
 * @route POST /api/attendances/leave
 * @description 创建请假申请
 * @access 需认证
 * @params employee_id: 员工ID
 * @params leave_type: 请假类型
 * @params start_date: 开始日期
 * @params end_date: 结束日期
 * @params reason: 请假原因
 */
router.post('/leave', AttendanceController.createLeaveApplication);

/**
 * @route PUT /api/attendances/leave/:id
 * @description 更新请假申请
 * @access 需认证
 * @params id: 请假记录ID
 * @params status: 审批状态
 * @params approved_by: 审批人ID
 */
router.put('/leave/:id', AttendanceController.updateLeaveApplication);

/**
 * @route GET /api/attendances/employee/:employeeId/leaves
 * @description 获取员工请假记录
 * @access 需认证
 * @params employeeId: 员工ID
 * @params startDate: 开始日期
 * @params endDate: 结束日期
 */
router.get('/employee/:employeeId/leaves', AttendanceController.getEmployeeLeaveApplications);

/**
 * @route POST /api/attendances/exception
 * @description 上报异常考勤
 * @access 需认证
 * @params employee_id: 员工ID
 * @params date: 异常日期
 * @params reason: 异常原因
 * @params evidence: 证明材料
 */
router.post('/exception', AttendanceController.reportExceptionalAttendance);

/**
 * @route PUT /api/attendances/exception/:id
 * @description 处理异常考勤
 * @access 需认证
 * @params id: 异常记录ID
 * @params status: 处理状态
 * @params handled_by: 处理人ID
 * @params comment: 处理意见
 */
router.put('/exception/:id', AttendanceController.handleExceptionalAttendance);

export default router;