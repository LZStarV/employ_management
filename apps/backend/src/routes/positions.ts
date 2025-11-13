import Router from 'koa-router';
import PositionController from '../controllers/PositionController';

const router = new Router();

/**
 * @swagger
 * tags:
 *   name: 职位管理
 *   description: 职位信息管理相关接口
 */

/**
 * @swagger
 * /positions:
 *   get:
 *     summary: 获取所有职位列表
 *     description: 获取系统中所有职位的信息列表
 *     tags: [职位管理]
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
 *     responses:
 *       200:
 *         description: 职位列表获取成功
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
 *                       position_id:
 *                         type: integer
 *                         example: 1
 *                       position_name:
 *                         type: string
 *                         example: "高级工程师"
 *                       level:
 *                         type: string
 *                         example: "P5"
 *                       description:
 *                         type: string
 *                         example: "负责核心系统开发"
 *                 total:
 *                   type: integer
 *                   example: 10
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 20
 */
router.get('/', PositionController.getAllPositions);

/**
 * @swagger
 * /positions/search:
 *   get:
 *     summary: 搜索职位
 *     description: 根据职位名称、级别等条件搜索职位
 *     tags: [职位管理]
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
 *                     type: object
 *                     properties:
 *                       position_id:
 *                         type: integer
 *                       position_name:
 *                         type: string
 *                       level:
 *                         type: string
 *                       description:
 *                         type: string
 *                 total:
 *                   type: integer
 *                   example: 5
 */
router.get('/search', PositionController.searchPositions);

/**
 * @swagger
 * /positions/{id}:
 *   get:
 *     summary: 获取职位详情
 *     description: 根据职位ID获取详细的职位信息
 *     tags: [职位管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 职位ID
 *     responses:
 *       200:
 *         description: 职位详情获取成功
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
 *                     position_id:
 *                       type: integer
 *                     position_name:
 *                       type: string
 *                     level:
 *                       type: string
 *                     description:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: 职位不存在
 */
router.get('/:id', PositionController.getPositionById);

/**
 * @swagger
 * /positions/{id}/employees:
 *   get:
 *     summary: 获取职位的员工列表
 *     description: 获取指定职位下的所有员工列表
 *     tags: [职位管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 职位ID
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
 *                   example: 30
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 20
 */
router.get('/:id/employees', PositionController.getPositionEmployees);

/**
 * @swagger
 * /positions:
 *   post:
 *     summary: 创建新职位
 *     description: 创建新的职位记录
 *     tags: [职位管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - position_name
 *               - level
 *             properties:
 *               position_name:
 *                 type: string
 *                 example: "高级工程师"
 *               level:
 *                 type: string
 *                 example: "P5"
 *               description:
 *                 type: string
 *                 example: "负责核心系统开发"
 *     responses:
 *       201:
 *         description: 职位创建成功
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
 *                     position_id:
 *                       type: integer
 *                     position_name:
 *                       type: string
 *                     level:
 *                       type: string
 *                     description:
 *                       type: string
 *       400:
 *         description: 请求参数错误
 */
router.post('/', PositionController.createPosition);

/**
 * @swagger
 * /positions/{id}:
 *   put:
 *     summary: 更新职位信息
 *     description: 更新指定职位的基本信息
 *     tags: [职位管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 职位ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               position_name:
 *                 type: string
 *                 example: "高级工程师"
 *               level:
 *                 type: string
 *                 example: "P5"
 *               description:
 *                 type: string
 *                 example: "负责核心系统开发"
 *     responses:
 *       200:
 *         description: 职位信息更新成功
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
 *                     position_id:
 *                       type: integer
 *                     position_name:
 *                       type: string
 *                     level:
 *                       type: string
 *                     description:
 *                       type: string
 *       404:
 *         description: 职位不存在
 */
router.put('/:id', PositionController.updatePosition);

/**
 * @swagger
 * /positions/{id}:
 *   delete:
 *     summary: 删除职位
 *     description: 从系统中删除指定职位记录
 *     tags: [职位管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 职位ID
 *     responses:
 *       200:
 *         description: 职位删除成功
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
 *                   example: "职位删除成功"
 *       404:
 *         description: 职位不存在
 *       409:
 *         description: 职位下仍有员工，无法删除
 */
router.delete('/:id', PositionController.deletePosition);

/**
 * @swagger
 * /positions/promote:
 *   post:
 *     summary: 员工职级晋升
 *     description: 为员工进行职级晋升或职位变更
 *     tags: [职位管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *               - new_position_id
 *               - new_salary
 *               - change_reason
 *               - changed_by
 *             properties:
 *               employee_id:
 *                 type: string
 *                 example: "EMP123"
 *               new_position_id:
 *                 type: integer
 *                 example: 2
 *               new_salary:
 *                 type: number
 *                 example: 15000
 *               change_reason:
 *                 type: string
 *                 example: "表现优秀，符合晋升条件"
 *               changed_by:
 *                 type: string
 *                 example: "HR001"
 *               promotion_type:
 *                 type: string
 *                 enum: [Promotion, Demotion, Transfer, Other]
 *                 example: "Promotion"
 *               notes:
 *                 type: string
 *                 example: "2023年度优秀员工"
 *     responses:
 *       201:
 *         description: 员工职级晋升成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/promote', PositionController.promoteEmployee);

/**
 * @swagger
 * /positions/history/employee/{employee_id}:
 *   get:
 *     summary: 获取员工职位变更历史
 *     description: 获取指定员工的所有职位变更历史记录
 *     tags: [职位管理]
 *     parameters:
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 员工ID
 *     responses:
 *       200:
 *         description: 职位变更历史获取成功
 *       404:
 *         description: 员工不存在
 */
router.get('/history/employee/:employee_id', PositionController.getEmployeePositionHistory);

/**
 * @swagger
 * /positions/history/{id}:
 *   get:
 *     summary: 获取职位变更历史详情
 *     description: 根据记录ID获取职位变更历史的详细信息
 *     tags: [职位管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 记录ID
 *     responses:
 *       200:
 *         description: 职位变更历史详情获取成功
 *       404:
 *         description: 记录不存在
 */
router.get('/history/:id', PositionController.getPositionHistoryById);

/**
 * @swagger
 * /positions/promotions/stats:
 *   get:
 *     summary: 获取晋升统计信息
 *     description: 获取系统中职位晋升的统计数据
 *     tags: [职位管理]
 *     responses:
 *       200:
 *         description: 晋升统计信息获取成功
 */
router.get('/promotions/stats', PositionController.getPromotionStats);

/**
 * @swagger
 * /positions/promotions/employee/{employee_id}:
 *   get:
 *     summary: 获取员工特定类型的晋升历史
 *     description: 获取指定员工的特定类型职位变更历史
 *     tags: [职位管理]
 *     parameters:
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 员工ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Promotion, Demotion, Transfer, Other]
 *         description: 变更类型
 *     responses:
 *       200:
 *         description: 晋升历史获取成功
 *       404:
 *         description: 员工不存在
 */
router.get('/promotions/employee/:employee_id', PositionController.getEmployeePromotionHistory);

export default router;