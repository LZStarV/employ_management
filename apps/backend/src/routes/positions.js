const Router = require('koa-router');
const PositionController = require('../controllers/PositionController');

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

module.exports = router;