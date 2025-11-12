const Router = require('koa-router');
const ProjectController = require('../controllers/ProjectController');

const router = new Router();

/**
 * @swagger
 * tags:
 *   name: 项目管理
 *   description: 项目信息管理相关接口
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: 获取所有项目列表
 *     description: 获取系统中所有项目的信息列表，支持分页和状态筛选
 *     tags: [项目管理]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, active, paused, completed]
 *         description: 项目状态筛选
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
 *                 total:
 *                   type: integer
 *                   example: 15
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 20
 */
router.get('/', ProjectController.getAllProjects);

/**
 * @swagger
 * /projects/search:
 *   get:
 *     summary: 搜索项目
 *     description: 根据项目名称、描述等条件搜索项目
 *     tags: [项目管理]
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
 *                     $ref: '#/components/schemas/Project'
 *                 total:
 *                   type: integer
 *                   example: 5
 */
router.get('/search', ProjectController.searchProjects);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: 获取项目详情
 *     description: 根据项目ID获取详细的项目信息，包括项目成员和进度信息
 *     tags: [项目管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 项目详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: 项目不存在
 */
router.get('/:id', ProjectController.getProjectById);

/**
 * @swagger
 * /projects/{id}/members:
 *   get:
 *     summary: 获取项目成员列表
 *     description: 获取指定项目的所有成员列表
 *     tags: [项目管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
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
 *         description: 成员列表获取成功
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
 *                       employee_id:
 *                         type: integer
 *                       employee_name:
 *                         type: string
 *                       role:
 *                         type: string
 *                       contribution_hours:
 *                         type: number
 *                         format: float
 *                       start_date:
 *                         type: string
 *                         format: date
 *                       end_date:
 *                         type: string
 *                         format: date
 *                 total:
 *                   type: integer
 *                   example: 25
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 20
 */
router.get('/:id/members', ProjectController.getProjectMembers);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: 创建新项目
 *     description: 创建新的项目记录
 *     tags: [项目管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_name
 *               - description
 *               - start_date
 *             properties:
 *               project_name:
 *                 type: string
 *                 example: "企业资源管理系统"
 *               description:
 *                 type: string
 *                 example: "集成HR、财务、项目管理的综合性系统"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-01-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-12-31"
 *               status:
 *                 type: string
 *                 enum: [planning, active, paused, completed]
 *                 default: planning
 *               budget:
 *                 type: number
 *                 format: float
 *                 example: 1000000.00
 *     responses:
 *       201:
 *         description: 项目创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: 请求参数错误
 */
router.post('/', ProjectController.createProject);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: 更新项目信息
 *     description: 更新指定项目的基本信息
 *     tags: [项目管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_name:
 *                 type: string
 *                 example: "企业资源管理系统"
 *               description:
 *                 type: string
 *                 example: "集成HR、财务、项目管理的综合性系统"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-01-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-12-31"
 *               status:
 *                 type: string
 *                 enum: [planning, active, paused, completed]
 *               budget:
 *                 type: number
 *                 format: float
 *                 example: 1000000.00
 *     responses:
 *       200:
 *         description: 项目信息更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: 项目不存在
 */
router.put('/:id', ProjectController.updateProject);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: 删除项目
 *     description: 从系统中删除指定项目记录
 *     tags: [项目管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 项目删除成功
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
 *                   example: "项目删除成功"
 *       404:
 *         description: 项目不存在
 *       409:
 *         description: 项目下仍有成员，无法删除
 */
router.delete('/:id', ProjectController.deleteProject);

module.exports = router;