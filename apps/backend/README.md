# 员工管理系统后端部署指南

## 概述

本目录包含员工管理系统的后端代码，基于Koa.js + PostgreSQL + MVC架构开发。本指南将帮助您快速部署和启动后端服务。

## 功能特性

- **完整的MVC架构**
- **9个核心数据模型**，支持复杂的实体关系
- **RESTful API接口**
- **性能监控和日志记录**
- **事务支持和数据验证**
- **自动数据库初始化和数据填充**

## 多平台部署脚本

我们提供了针对不同操作系统的一键部署脚本，它们会自动完成以下工作：

1. 检查并安装系统依赖（Node.js 20.x、pnpm、PostgreSQL、Redis）
2. 配置PostgreSQL数据库和用户
3. 安装项目依赖
4. 创建.env配置文件
5. 初始化数据库结构
6. 填充测试数据（100000条记录）
7. 启动后端服务

## 操作系统兼容性

| 脚本文件 | 支持的操作系统 | 包管理器 |
|---------|------------|--------|
| `start.sh` | Linux (Ubuntu/Debian) | apt-get |
| `start_mac.sh` | macOS | Homebrew |
| `start.ps1` | Windows | PowerShell |

## 使用方法

### 1. 进入后端目录

**Linux/macOS:**
```bash
cd backend
```

**Windows:**
```powershell
cd backend
```

### 2. 根据操作系统选择对应的脚本

#### Linux系统

```bash
chmod +x start.sh  # 添加执行权限
sudo ./start.sh    # 一键部署（自动安装所有依赖）
# 或
./start.sh         # 仅启动服务（如果依赖已安装）
```

#### macOS系统

```bash
chmod +x start_mac.sh  # 添加执行权限
./start_mac.sh        # 一键部署（自动使用Homebrew安装依赖）
```

#### Windows系统

```powershell
# 以管理员身份打开PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process  # 允许执行脚本
./start.ps1  # 执行PowerShell脚本
```

### 3. 特别说明

- **Linux:** 使用apt-get包管理器，需要sudo权限安装系统依赖
- **macOS:** 
  - 使用Homebrew包管理器，脚本会自动安装Homebrew（如果未安装）
  - 自动使用当前系统用户名作为PostgreSQL用户（而不是postgres用户）
  - 自动更新.env文件中的数据库配置，确保连接成功
  - 包含重试机制，处理PostgreSQL服务启动延迟问题
- **Windows:** 使用PowerShell，需要手动安装一些系统组件，但脚本能引导您完成
- 所有脚本都会自动创建和配置PostgreSQL数据库
- 脚本会自动创建.env配置文件，并根据操作系统自动优化连接配置
- Mac版本脚本已增强鲁棒性：
  - 增加了详细的错误处理和状态提示
  - 实现了数据库初始化的重试机制
  - 自动检测和启动PostgreSQL服务
  - 在初始化失败时提供明确的故障排除提示

脚本会检测您是否以root用户运行，如果不是，会询问您是否继续。

## 环境要求

- Linux系统（推荐Ubuntu/Debian）
- Node.js 20.x
- PostgreSQL 12+
- pnpm（会自动安装）
- Redis（可选，用于性能监控）

## 数据库配置

脚本会自动创建以下数据库配置：

- 数据库名称：`employee_management`
- 用户名：`postgres`
- 密码：`postgres`
- 端口：`5432`

如果您需要自定义配置，请修改生成的`.env`文件。

## 服务访问

服务启动后，可以通过以下地址访问：

- 服务地址：http://localhost:3000
- 健康检查：http://localhost:3000/api/health
- API文档：http://localhost:3000/api/docs（Swagger UI）
- API文档JSON：http://localhost:3000/api/docs.json
- 性能统计：http://localhost:3000/api/performance

## Swagger API文档

系统集成了Swagger UI，提供完整的API文档和测试功能：

### 访问方式
- **Swagger UI界面**：http://localhost:3000/api/docs
- **OpenAPI规范**：http://localhost:3000/api/docs.json

### 功能特性
- 完整的API接口文档
- 在线接口测试
- 请求/响应示例
- 参数验证说明
- 认证配置说明

### 使用说明
1. 访问Swagger UI界面
2. 查看各个API接口的详细说明
3. 点击"Try it out"按钮进行接口测试
4. 查看请求示例和响应格式

## 项目结构

```
backend/
├── app.js                 # 应用入口
├── config/               # 配置文件
├── controllers/          # 控制器层
├── models/              # 数据模型层
├── routes/              # 路由配置
├── services/            # 业务逻辑层
├── middleware/          # 中间件
├── utils/               # 工具函数
├── scripts/             # 数据库脚本
└── start.sh             # 一键部署脚本
```

## 常见问题

### 1. PostgreSQL连接失败

- 确保PostgreSQL服务正在运行：`systemctl status postgresql`
- 检查数据库用户权限是否正确
- 查看错误日志获取详细信息

### 2. 端口被占用

如果3000端口已被占用，可以修改`.env`文件中的`PORT`配置。

### 3. 内存不足

确保服务器至少有1GB RAM，推荐2GB或更多。

## 性能监控

系统内置了性能监控功能，可以通过以下接口查看：

- 性能统计：http://localhost:3000/api/performance
- 日志文件：在`logs/`目录下

## 停止服务

按 `Ctrl + C` 可以停止正在运行的服务。

## 多平台初始化脚本

我们提供了针对不同操作系统的一键初始化脚本，它们会自动完成以下工作：

1. 检查并安装系统依赖（Node.js 20.x、pnpm、PostgreSQL、Redis）
2. 配置PostgreSQL数据库和用户
3. 安装项目依赖
4. 创建.env配置文件
5. 初始化数据库结构
6. 填充测试数据（100000条记录）

## 操作系统兼容性

| 脚本文件 | 支持的操作系统 | 包管理器 |
|---------|------------|--------|
| `init_linux.sh` | Linux (Ubuntu/Debian) | apt-get |
| `init_mac.sh` | macOS | Homebrew |
| `init_win.ps1` | Windows | PowerShell |

## 使用方法

### 1. 进入后端目录

**Linux/macOS:**
```bash
cd backend
```

**Windows:**
```powershell
cd backend
```

### 2. 根据操作系统选择对应的初始化脚本

#### Linux系统

```bash
chmod +x init_linux.sh  # 添加执行权限
sudo ./init_linux.sh    # 一键初始化（自动安装所有依赖）
```

#### macOS系统

```bash
chmod +x init_mac.sh    # 添加执行权限
./init_mac.sh           # 一键初始化（自动使用Homebrew安装依赖）
```

#### Windows系统

```powershell
# 以管理员身份打开PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process  # 允许执行脚本
./init_win.ps1  # 执行PowerShell脚本
```

### 3. 启动服务

初始化完成后，使用以下命令启动后端服务：

```bash
npm run dev    # 开发模式
# 或
node app.js    # 生产模式
```

### 4. 特别说明

- **Linux:** 使用apt-get包管理器，需要sudo权限安装系统依赖
- **macOS:** 
  - 使用Homebrew包管理器，脚本会自动安装Homebrew（如果未安装）
  - 自动使用当前系统用户名作为PostgreSQL用户（而不是postgres用户）
  - 自动更新.env文件中的数据库配置，确保连接成功
- **Windows:** 使用PowerShell，需要手动安装一些系统组件，但脚本能引导您完成
- 所有脚本都会自动创建和配置PostgreSQL数据库
- 脚本会自动创建.env配置文件，并根据操作系统自动优化连接配置

脚本会检测您是否以root用户运行，如果不是，会询问您是否继续。

## 环境要求

- Linux系统（推荐Ubuntu/Debian）
- Node.js 20.x
- PostgreSQL 12+
- pnpm（会自动安装）
- Redis（可选，用于性能监控）

## 数据库配置

脚本会自动创建以下数据库配置：

- 数据库名称：`employee_management`
- 用户名：`postgres`
- 密码：`postgres`
- 端口：`5432`

如果您需要自定义配置，请修改生成的`.env`文件。

## 服务访问

服务启动后，可以通过以下地址访问：

- 服务地址：http://localhost:3000
- 健康检查：http://localhost:3000/api/health
- API文档：http://localhost:3000/api（API列表）

## 项目结构

```
backend/
├── app.js                 # 应用入口
├── config/               # 配置文件
├── controllers/          # 控制器层
├── models/              # 数据模型层
├── routes/              # 路由配置
├── services/            # 业务逻辑层
├── middleware/          # 中间件
├── utils/               # 工具函数
├── scripts/             # 数据库脚本
├── init_linux.sh        # Linux初始化脚本
├── init_mac.sh          # macOS初始化脚本
└── init_win.ps1         # Windows初始化脚本
```

## 常见问题

### 1. PostgreSQL连接失败

- 确保PostgreSQL服务正在运行：`systemctl status postgresql`
- 检查数据库用户权限是否正确
- 查看错误日志获取详细信息

### 2. 端口被占用

如果3000端口已被占用，可以修改`.env`文件中的`PORT`配置。

### 3. 内存不足

确保服务器至少有1GB RAM，推荐2GB或更多。

## 性能监控

系统内置了性能监控功能，可以通过以下接口查看：

- 性能统计：http://localhost:3000/api/performance
- 日志文件：在`logs/`目录下

## 停止服务

按 `Ctrl + C` 可以停止正在运行的服务。