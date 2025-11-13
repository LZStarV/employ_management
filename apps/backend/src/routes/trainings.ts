import Router from 'koa-router';
import { Context } from 'koa';
import TrainingController from '../controllers/TrainingController';

const router = new Router();

/**
 * @swagger
 * tags:
 *   name: 培训管理
 *   description: 员工培训管理相关接口
 */

/**
 * @swagger
 * /trainings:
 *   get:
 *     summary: 获取培训列表
 *     description: 获取所有培训课程列表，支持分页和状态筛选
 *     tags: [培训管理]
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
 *           enum: [planning, ongoing, completed, cancelled]
 *         description: 培训状态筛选
 *     responses:
 *       200:
 *         description: 培训列表获取成功
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
 *                       training_id:
 *                         type: integer
 *                         example: 1
 *                       training_name:
 *                         type: string
 *                         example: "新员工入职培训"
 *                       description:
 *                         type: string
 *                         example: "新员工入职基础培训课程"
 *                       start_date:
 *                         type: string
 *                         format: date
 *                         example: "2023-06-01"
 *                       end_date:
 *                         type: string
 *                         format: date
 *                         example: "2023-06-05"
 *                       location:
 *                         type: string
 *                         example: "培训中心A厅"
 *                       instructor:
 *                         type: string
 *                         example: "李老师"
 *                       status:
 *                         type: string
 *                         enum: [planning, ongoing, completed, cancelled]
 *                         example: "completed"
 *                       participant_count:
 *                         type: integer
 *                         example: 50
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
router.get('/', TrainingController.getAllTrainings);

/**
 * @swagger
 * /trainings/{id}:
 *   get:
 *     summary: 获取培训详情
 *     description: 根据培训ID获取详细的培训信息，包括参与员工列表
 *     tags: [培训管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 培训ID
 *     responses:
 *       200:
 *         description: 培训详情获取成功
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
 *                     training_id:
 *                       type: integer
 *                     training_name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *                     location:
 *                       type: string
 *                     instructor:
 *                       type: string
 *                     status:
 *                       type: string
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           employee_id:
 *                             type: integer
 *                           employee_name:
 *                             type: string
 *                           completion_status:
 *                             type: string
 *                             enum: [not_started, in_progress, completed]
 *       404:
 *         description: 培训不存在
 */
router.get('/:id', TrainingController.getTrainingById);

/**
 * @swagger
 * /trainings:
 *   post:
 *     summary: 创建培训课程
 *     description: 创建新的培训课程记录
 *     tags: [培训管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - training_name
 *               - start_date
 *               - end_date
 *             properties:
 *               training_name:
 *                 type: string
 *                 example: "新员工入职培训"
 *               description:
 *                 type: string
 *                 example: "新员工入职基础培训课程"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-05"
 *               location:
 *                 type: string
 *                 example: "培训中心A厅"
 *               instructor:
 *                 type: string
 *                 example: "李老师"
 *               max_participants:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       201:
 *         description: 培训创建成功
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
 *                     training_id:
 *                       type: integer
 *                     training_name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *       400:
 *         description: 请求参数错误
 */
router.post('/', TrainingController.createTraining);

/**
 * @swagger
 * /trainings/{id}/enroll:
 *   post:
 *     summary: 员工报名培训
 *     description: 员工报名参加指定的培训课程
 *     tags: [培训管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 培训ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *             properties:
 *               employee_id:
 *                 type: integer
 *                 example: 10001
 *     responses:
 *       200:
 *         description: 报名成功
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
 *                     enrollment_id:
 *                       type: integer
 *                     training_id:
 *                       type: integer
 *                     employee_id:
 *                       type: integer
 *                     enrollment_date:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 请求参数错误或培训已满员
 *       404:
 *         description: 培训或员工不存在
 */
router.post('/:id/enroll', TrainingController.registerEmployee);

export default router;