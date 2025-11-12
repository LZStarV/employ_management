# 员工管理系统 - Monorepo架构

基于pnpm workspace构建的现代化员工管理系统，采用前后端分离架构。

## 🏗️ 项目结构

```
employee-management-monorepo/
├── apps/                    # 应用目录
│   ├── backend/             # 后端API服务
│   └── frontend/            # 前端Vue应用
├── packages/                # 共享包目录
│   ├── shared/              # 共享工具和配置
│   └── types/               # TypeScript类型定义
├── package.json             # 根package.json
├── pnpm-workspace.yaml      # pnpm workspace配置
└── README.md               # 项目说明
```

## 🚀 快速开始

### 前置要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14
- Redis >= 6

### 安装依赖

```bash
# 安装pnpm (如果未安装)
npm install -g pnpm@8.15.0

# 安装项目依赖
pnpm install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp apps/backend/.env.example apps/backend/.env
```

2. 配置数据库连接信息：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=employee_management

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT配置
JWT_SECRET=your-secret-key
```

### 启动开发环境

```bash
# 同时启动前后端服务
pnpm dev

# 或分别启动
pnpm backend:dev
pnpm frontend:dev
```

## 📦 包说明

### @employee-management/backend
后端API服务，基于Koa2 + Sequelize构建。

### @employee-management/frontend
前端Vue3应用，使用Element Plus UI组件库。

### @employee-management/types
TypeScript类型定义，包含所有数据模型和API接口类型。

### @employee-management/shared
共享工具函数和配置，包含通用工具、配置常量等。

## 🛠️ 开发脚本

### 根目录脚本

```bash
# 安装所有依赖
pnpm install

# 启动所有服务
pnpm dev

# 构建所有包
pnpm build

# 运行所有测试
pnpm test

# 运行代码检查
pnpm lint
```

### 包级别脚本

```bash
# 安装特定包依赖
pnpm --filter @employee-management/backend install

# 启动特定服务
pnpm --filter @employee-management/backend dev

# 构建特定包
pnpm --filter @employee-management/frontend build
```

## 🔧 开发工具

### 代码规范
- ESLint - 代码质量检查
- Prettier - 代码格式化
- TypeScript - 类型检查

### 测试框架
- Jest - 后端测试
- Vitest - 前端测试

### 构建工具
- Vite - 前端构建工具
- TypeScript Compiler - 类型包构建

## 📊 数据库设计

项目使用PostgreSQL数据库，包含以下主要表：

- `employees` - 员工信息
- `departments` - 部门信息
- `positions` - 职位信息
- `salaries` - 薪资信息
- `projects` - 项目信息
- `attendances` - 考勤记录
- `trainings` - 培训信息

详细数据库设计请参考 `database_design.md` 文件。

## 🔐 认证授权

系统使用JWT进行用户认证，支持以下功能：

- 用户登录/登出
- 权限验证
- Token自动刷新
- 安全密码加密

## 📈 性能优化

- Redis缓存层
- 数据库连接池
- API响应压缩
- 前端代码分割

## 🚢 部署

### 生产环境构建

```bash
# 构建所有包
pnpm build

# 或分别构建
pnpm backend:build
pnpm frontend:build
```

### Docker部署

项目支持Docker容器化部署，相关配置文件位于 `docker/` 目录。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

**员工管理系统** - 现代化的企业人力资源管理解决方案