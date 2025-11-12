const Router = require('koa-router');
const DepartmentController = require('../controllers/DepartmentController');

const router = new Router();

/**
 * @swagger
 * tags:
 *   name: 部门管理
 *   description: 部门信息管理相关接口
 */

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: 获取所有部门列表
 *     description: 获取系统中所有部门的信息列表
 *     tags: [部门管理]
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
 *         description: 部门列表获取成功
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
 *                     $ref: '#/components/schemas/Department'
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
router.get('/', DepartmentController.getAllDepartments);

/**
 * @swagger
 * /departments/search:
 *   get:
 *     summary: 搜索部门
 *     description: 根据部门名称、位置等条件搜索部门
 *     tags: [部门管理]
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
 *                     $ref: '#/components/schemas/Department'
 *                 total:
 *                   type: integer
 *                   example: 5
 */
router.get('/search', DepartmentController.searchDepartments);

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: 获取部门详情
 *     description: 根据部门ID获取详细的部门信息，包括部门经理信息
 *     tags: [部门管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 部门ID
 *     responses:
 *       200:
 *         description: 部门详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       404:
 *         description: 部门不存在
 */
router.get('/:id', DepartmentController.getDepartmentById);

/**
 * @swagger
 * /departments/{id}/employees:
 *   get:
 *     summary: 获取部门的员工列表
 *     description: 获取指定部门下的所有员工列表
 *     tags: [部门管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 部门ID
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
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 20
 */
router.get('/:id/employees', DepartmentController.getDepartmentEmployees);

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: 创建新部门
 *     description: 创建新的部门记录
 *     tags: [部门管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - department_name
 *               - location
 *             properties:
 *               department_name:
 *                 type: string
 *                 example: "技术部"
 *               location:
 *                 type: string
 *                 example: "北京总部"
 *               manager_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: 部门创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       400:
 *         description: 请求参数错误
 */
router.post('/', DepartmentController.createDepartment);

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     summary: 更新部门信息
 *     description: 更新指定部门的基本信息
 *     tags: [部门管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 部门ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department_name:
 *                 type: string
 *                 example: "技术部"
 *               location:
 *                 type: string
 *                 example: "北京总部"
 *               manager_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: 部门信息更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       404:
 *         description: 部门不存在
 */
router.put('/:id', DepartmentController.updateDepartment);

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: 删除部门
 *     description: 从系统中删除指定部门记录
 *     tags: [部门管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 部门ID
 *     responses:
 *       200:
 *         description: 部门删除成功
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
 *                   example: "部门删除成功"
 *       404:
 *         description: 部门不存在
 *       409:
 *         description: 部门下仍有员工，无法删除
 */
router.delete('/:id', DepartmentController.deleteDepartment);

module.exports = router;