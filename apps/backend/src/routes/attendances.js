const Router = require('koa-router');
const AttendanceController = require('../controllers/AttendanceController');

const router = new Router();

/**
 * @swagger
 * tags:
 *   name: 考勤管理
 *   description: 员工考勤记录管理相关接口
 */

/**
 * @swagger
 * /attendances:
 *   get:
 *     summary: 获取员工考勤列表
 *     description: 获取所有员工的考勤记录，支持按日期、员工、部门筛选
 *     tags: [考勤管理]
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: 员工ID筛选
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: integer
 *         description: 部门ID筛选
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 查询日期
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 考勤状态筛选
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 考勤记录获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       attendance_id:
 *                         type: integer
 *                         example: 1
 *                       employee_id:
 *                         type: integer
 *                         example: 10001
 *                       employee_name:
 *                         type: string
 *                         example: "张三"
 *                       department_name:
 *                         type: string
 *                         example: "技术部"
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2023-06-15"
 *                       check_in_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-06-15T09:00:00Z"
 *                       check_out_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-06-15T18:00:00Z"
 *                       work_hours:
 *                         type: number
 *                         format: float
 *                         example: 8.5
 *                       status:
 *                         type: string
 *                         example: "present"
 *                       remark:
 *                         type: string
 *                         example: "正常出勤"
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 20
 */
router.get('/', AttendanceController.getAttendanceList);

/**
 * @swagger
 * /attendances/employee/{employeeId}:
 *   get:
 *     summary: 获取员工考勤详情
 *     description: 获取指定员工的详细考勤记录
 *     tags: [考勤管理]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 员工考勤详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     employee_id:
 *                       type: integer
 *                     employee_name:
 *                       type: string
 *                     department_name:
 *                       type: string
 *                     attendance_records:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           check_in_time:
 *                             type: string
 *                             format: date-time
 *                           check_out_time:
 *                             type: string
 *                             format: date-time
 *                           work_hours:
 *                             type: number
 *                             format: float
 *                           status:
 *                             type: string
 *                           remark:
 *                             type: string
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         total_days:
 *                           type: integer
 *                         work_days:
 *                           type: integer
 *                         attendance_rate:
 *                           type: number
 *                           format: float
 *                         late_count:
 *                           type: integer
 *                         early_leave_count:
 *                           type: integer
 *                         absent_count:
 *                           type: integer
 *                         overtime_hours:
 *                           type: number
 *                           format: float
 */
router.get('/employee/:employeeId', AttendanceController.getEmployeeAttendanceDetail);

/**
 * @swagger
 * /attendances/statistics:
 *   get:
 *     summary: 获取考勤统计
 *     description: 获取考勤统计信息，包括出勤率、迟到早退统计等
 *     tags: [考勤管理]
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: integer
 *         description: 部门ID筛选
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 统计信息获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_employees:
 *                       type: integer
 *                       example: 50
 *                     attendance_rate:
 *                       type: number
 *                       format: float
 *                       example: 95.5
 *                     late_count:
 *                       type: integer
 *                       example: 5
 *                     early_leave_count:
 *                       type: integer
 *                       example: 3
 *                     absent_count:
 *                       type: integer
 *                       example: 2
 *                     overtime_hours:
 *                       type: number
 *                       format: float
 *                       example: 120.5
 *                     department_stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           department_name:
 *                             type: string
 *                           attendance_rate:
 *                             type: number
 *                             format: float
 *                           late_count:
 *                             type: integer
 *                           early_leave_count:
 *                             type: integer
 *                           absent_count:
 *                             type: integer
 */
router.get('/statistics', AttendanceController.getAttendanceStatistics);

module.exports = router;