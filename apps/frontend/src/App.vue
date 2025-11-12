<template>
  <div class="app-container">
    <el-container class="main-container">
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title" @click="$router.push('/')" style="cursor: pointer;">员工管理系统</h1>
          <div class="header-actions">
            <el-button type="primary" @click="refreshData">刷新数据</el-button>
          </div>
        </div>
      </el-header>
      
      <el-container>
        <el-aside width="200px" class="app-sidebar">
          <el-menu
            :default-active="activeMenu"
            class="sidebar-menu"
            router
            @select="handleMenuSelect"
          >
            <el-menu-item index="/">
              <el-icon><Document /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="/employees">
              <el-icon><User /></el-icon>
              <span>员工管理</span>
            </el-menu-item>
            <el-menu-item index="/departments">
              <el-icon><OfficeBuilding /></el-icon>
              <span>部门管理</span>
            </el-menu-item>
            <el-menu-item index="/projects">
              <el-icon><Briefcase /></el-icon>
              <span>项目管理</span>
            </el-menu-item>
            <el-menu-item index="/attendance">
              <el-icon><Clock /></el-icon>
              <span>考勤管理</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
        <el-main class="app-main">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Document, User, OfficeBuilding, Briefcase, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'App',
  components: {
    Document,
    User,
    OfficeBuilding,
    Briefcase,
    Clock
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // 计算当前激活的菜单
    const activeMenu = computed(() => {
      return route.path || '/'
    })
    
    // 处理菜单选择
    const handleMenuSelect = (key) => {
      router.push(key)
    }
    
    // 刷新数据
    const refreshData = () => {
      const currentRoute = route.path
      
      // 根据当前路由触发相应的数据刷新
      if (currentRoute === '/') {
        // 首页刷新：触发首页组件的刷新方法
        window.dispatchEvent(new CustomEvent('refresh-home-data'))
      } else if (currentRoute === '/employees') {
        // 员工列表刷新
        window.dispatchEvent(new CustomEvent('refresh-employees-data'))
      } else if (currentRoute === '/departments') {
        // 部门列表刷新
        window.dispatchEvent(new CustomEvent('refresh-departments-data'))
      } else if (currentRoute === '/projects') {
        // 项目列表刷新
        window.dispatchEvent(new CustomEvent('refresh-projects-data'))
      } else if (currentRoute === '/attendance' || currentRoute.startsWith('/attendance/')) {
        // 考勤管理刷新
        window.dispatchEvent(new CustomEvent('refresh-attendance-data'))
      }
      
      ElMessage.success('数据刷新成功')
    }
    
    return {
      activeMenu,
      handleMenuSelect,
      refreshData
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.app-container {
  height: 100vh;
  overflow: auto;
}

.main-container {
  height: 100%;
}

.app-header {
  background-color: #2c3e50;
  color: white;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.app-title {
  font-size: 24px;
  font-weight: 500;
}

.app-sidebar {
  background-color: #f5f7fa;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
}

.sidebar-menu {
  height: 100%;
  border-right: none;
}

.app-main {
  padding: 20px;
  overflow-y: auto;
  background-color: #f0f2f5;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>