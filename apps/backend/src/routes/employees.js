const Router = require('koa-router');
const EmployeeController = require('../controllers/EmployeeController');

const router = new Router();

/**
 * @swagger
 * tags:
 *   name: 员工管理
 *   description: 员工信息管理相关接口
 */

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: 获取所有员工列表
 *     description: 获取系统中所有员工的信息列表，支持分页和筛选
 *     tags: [员工管理]
 *     parameters:
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
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: integer
 *         description: 部门ID筛选
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, resigned, on_leave, inactive]
 *         description: 员工状态筛选
 *     responses:
 *       200:
 *         description: 员工列表获取成功
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
 *                     $ref: '#/components/schemas/Employee'
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
router.get('/', EmployeeController.getAllEmployees);

/**
 * @swagger
 * /employees/search:
 *   get:
 *     summary: 搜索员工
 *     description: 根据姓名、邮箱、电话等条件搜索员工
 *     tags: [员工管理]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
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
 *         description: 搜索成功
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
 *                     $ref: '#/components/schemas/Employee'
 *                 total:
 *                   type: integer
 *                   example: 10
 */
router.get('/search', EmployeeController.searchEmployees);

/**
 * @swagger
 * /employees/statistics:
 *   get:
 *     summary: 获取员工统计
 *     description: 获取员工数量、状态分布等统计信息
 *     tags: [员工管理]
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
 *                     totalCount:
 *                       type: integer
 *                       example: 10000
 *                     activeCount:
 *                       type: integer
 *                       example: 8500
 *                     resignedCount:
 *                       type: integer
 *                       example: 1000
 *                     onLeaveCount:
 *                       type: integer
 *                       example: 300
 *                     inactiveCount:
 *                       type: integer
 *                       example: 200
 *                     departmentDistribution:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 */
router.get('/statistics', EmployeeController.getStatistics);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: 获取员工详情
 *     description: 根据员工ID获取详细的员工信息
 *     tags: [员工管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     responses:
 *       200:
 *         description: 员工详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: 员工不存在
 */
router.get('/:id', EmployeeController.getEmployeeById);

/**
 * @swagger
 * /employees/{id}/projects:
 *   get:
 *     summary: 获取员工参与的项目
 *     description: 获取指定员工参与的所有项目列表
 *     tags: [员工管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     responses:
 *       200:
 *         description: 项目列表获取成功
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
 *                     $ref: '#/components/schemas/Project'
 */
router.get('/:id/projects', EmployeeController.getEmployeeProjects);

/**
 * @swagger
 * /employees/{id}/trainings:
 *   get:
 *     summary: 获取员工培训记录
 *     description: 获取指定员工的所有培训记录
 *     tags: [员工管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     responses:
 *       200:
 *         description: 培训记录获取成功
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
 *                       trainingId:
 *                         type: integer
 *                       trainingName:
 *                         type: string
 *                       completionDate:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                         enum: [completed, in_progress, not_started]
 */
router.get('/:id/trainings', EmployeeController.getEmployeeTrainings);

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: 创建新员工
 *     description: 创建新的员工记录
 *     tags: [员工管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - phone
 *               - hire_date
 *               - department_id
 *               - position_id
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "张"
 *               last_name:
 *                 type: string
 *                 example: "三"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "zhangsan@example.com"
 *               phone:
 *                 type: string
 *                 example: "13800138000"
 *               hire_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-01-15"
 *               department_id:
 *                 type: integer
 *                 example: 1
 *               position_id:
 *                 type: integer
 *                 example: 1
 *               status:
 *                 type: string
 *                 enum: [active, resigned, on_leave, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: 员工创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       400:
 *         description: 请求参数错误
 */
router.post('/', EmployeeController.createEmployee);

/**
 * @swagger
 * /employees/batch-import:
 *   post:
 *     summary: 批量导入员工
 *     description: 通过Excel或CSV文件批量导入员工数据
 *     tags: [员工管理]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 员工数据文件（支持Excel/CSV格式）
 *     responses:
 *       200:
 *         description: 批量导入成功
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
 *                     importedCount:
 *                       type: integer
 *                       example: 100
 *                     failedCount:
 *                       type: integer
 *                       example: 2
 *                     failedRecords:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                           error:
 *                             type: string
 *       400:
 *         description: 文件格式错误或数据验证失败
 */
router.post('/batch-import', EmployeeController.batchImport);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: 更新员工信息
 *     description: 更新指定员工的基本信息
 *     tags: [员工管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "张"
 *               last_name:
 *                 type: string
 *                 example: "三"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "zhangsan@example.com"
 *               phone:
 *                 type: string
 *                 example: "13800138000"
 *               hire_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-01-15"
 *               department_id:
 *                 type: integer
 *                 example: 1
 *               position_id:
 *                 type: integer
 *                 example: 1
 *               status:
 *                 type: string
 *                 enum: [active, resigned, on_leave, inactive]
 *     responses:
 *       200:
 *         description: 员工信息更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: 员工不存在
 */
router.put('/:id', EmployeeController.updateEmployee);

/**
 * @swagger
 * /employees/{id}/transfer:
 *   put:
 *     summary: 员工调动
 *     description: 将员工从一个部门/职位调动到另一个部门/职位
 *     tags: [员工管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_department_id
 *               - new_position_id
 *             properties:
 *               new_department_id:
 *                 type: integer
 *                 example: 2
 *               new_position_id:
 *                 type: integer
 *                 example: 3
 *               effective_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-01"
 *     responses:
 *       200:
 *         description: 员工调动成功
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
 *                     employeeId:
 *                       type: integer
 *                     oldDepartment:
 *                       type: string
 *                     newDepartment:
 *                       type: string
 *                     oldPosition:
 *                       type: string
 *                     newPosition:
 *                       type: string
 *                     effectiveDate:
 *                       type: string
 *                       format: date
 *       404:
 *         description: 员工或部门/职位不存在
 */
router.put('/:id/transfer', EmployeeController.transferEmployee);

/**
 * @swagger
 * /employees/{id}/adjust-salary:
 *   put:
 *     summary: 薪资调整
 *     description: 调整员工的薪资信息
 *     tags: [员工管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - basic_salary
 *               - bonus
 *               - allowances
 *             properties:
 *               basic_salary:
 *                 type: number
 *                 format: float
 *                 example: 10000.00
 *               bonus:
 *                 type: number
 *                 format: float
 *                 example: 2000.00
 *               allowances:
 *                 type: number
 *                 format: float
 *                 example: 500.00
 *               effective_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-01"
 *     responses:
 *       200:
 *         description: 薪资调整成功
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
 *                     employeeId:
 *                       type: integer
 *                     oldSalary:
 *                       type: object
 *                       properties:
 *                         basic_salary:
 *                           type: number
 *                         bonus:
 *                           type: number
 *                         allowances:
 *                           type: number
 *                     newSalary:
 *                       type: object
 *                       properties:
 *                         basic_salary:
 *                           type: number
 *                         bonus:
 *                           type: number
 *                         allowances:
 *                           type: number
 *                     effectiveDate:
 *                       type: string
 *                       format: date
 *       404:
 *         description: 员工不存在
 */
router.put('/:id/adjust-salary', EmployeeController.adjustSalary);

/**
 * @swagger
 * /employees/{id}/resignation:
 *   put:
 *     summary: 员工离职处理
 *     description: 处理员工离职流程
 *     tags: [员工管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resignation_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-01"
 *               reason:
 *                 type: string
 *                 example: "个人发展"
 *     responses:
 *       200:
 *         description: 离职处理成功
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
 *                     employeeId:
 *                       type: integer
 *                     employeeName:
 *                       type: string
 *                     previousStatus:
 *                       type: string
 *                     resignationDate:
 *                       type: string
 *                       format: date
 *                     reason:
 *                       type: string
 *       404:
 *         description: 员工不存在
 */
router.put('/:id/resignation', EmployeeController.processResignation);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: 删除员工
 *     description: 从系统中删除指定员工记录
 *     tags: [员工管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 员工ID
 *     responses:
 *       200:
 *         description: 员工删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "员工删除成功"
 *       404:
 *         description: 员工不存在
 */
router.delete('/:id', EmployeeController.deleteEmployee);

module.exports = router;