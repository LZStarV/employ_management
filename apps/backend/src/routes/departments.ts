import Router from 'koa-router';
import DepartmentController from '../controllers/DepartmentController';
import { Context } from 'koa';

const router = new Router({ prefix: '/api/departments' });

// 获取部门列表
router.get('/', DepartmentController.getAllDepartments);

// 搜索部门
router.get('/search', async (ctx: Context) => {
  try {
    const { keyword } = ctx.query;
    const departments = await DepartmentController.searchDepartments({ keyword: keyword as string });
    ctx.status = 200;
    ctx.body = { success: true, data: departments };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: 'Internal Server Error' };
  }
});

// 获取部门详情
router.get('/:id', DepartmentController.getDepartmentById);

// 获取部门员工
router.get('/:id/employees', DepartmentController.getDepartmentWithEmployees);

// 创建部门
router.post('/', DepartmentController.createDepartment);

// 更新部门
router.put('/:id', DepartmentController.updateDepartment);

// 删除部门
router.delete('/:id', DepartmentController.deleteDepartment);

export default router;