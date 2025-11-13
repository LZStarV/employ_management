import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

// 懒加载路由组件
const Home = () => import('../pages/Home.vue')
const EmployeeList = () => import('../pages/EmployeeList.vue')
const DepartmentList = () => import('../pages/DepartmentList.vue')
const ProjectList = () => import('../pages/ProjectList.vue')
const EmployeeDetail = () => import('../pages/EmployeeDetail.vue')
const DepartmentDetail = () => import('../pages/DepartmentDetail.vue')
const ProjectDetail = () => import('../pages/ProjectDetail.vue')
const AttendanceList = () => import('../pages/AttendanceList.vue')
const AttendanceDetail = () => import('../pages/AttendanceDetail.vue')

// 扩展路由元信息类型
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页'
    }
  },
  {
    path: '/employees',
    name: 'EmployeeList',
    component: EmployeeList,
    meta: {
      title: '员工列表'
    }
  },
  {
    path: '/employees/:id',
    name: 'EmployeeDetail',
    component: EmployeeDetail,
    meta: {
      title: '员工详情'
    },
    props: true
  },
  {
    path: '/departments',
    name: 'DepartmentList',
    component: DepartmentList,
    meta: {
      title: '部门列表'
    }
  },
  {
    path: '/departments/:id',
    name: 'DepartmentDetail',
    component: DepartmentDetail,
    meta: {
      title: '部门详情'
    },
    props: true
  },
  {
    path: '/projects',
    name: 'ProjectList',
    component: ProjectList,
    meta: {
      title: '项目列表'
    }
  },
  {
    path: '/projects/:id',
    name: 'ProjectDetail',
    component: ProjectDetail,
    meta: {
      title: '项目详情'
    },
    props: true
  },
  {
    path: '/attendance',
    name: 'AttendanceList',
    component: AttendanceList,
    meta: {
      title: '考勤管理'
    }
  },
  {
    path: '/attendance/employee/:employeeId',
    name: 'EmployeeAttendanceDetail',
    component: AttendanceDetail,
    meta: {
      title: '员工考勤详情'
    },
    props: true
  },
  // 404路由
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由前置守卫，设置页面标题
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 员工管理系统` : '员工管理系统'
  next()
})

export default router