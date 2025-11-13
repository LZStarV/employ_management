// Vue 组件类型扩展定义

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 扩展 Vue 全局属性
import { App } from 'vue'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    // 可以在这里定义全局属性的类型
    // 例如: $formatDate: (date: Date | string) => string
  }
}

// 扩展路由元信息
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    permissions?: string[]
    icon?: string
    hidden?: boolean
    keepAlive?: boolean
    breadcrumb?: boolean
  }
}