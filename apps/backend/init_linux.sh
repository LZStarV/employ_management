#!/bin/bash

# 员工管理系统后端部署和启动脚本
# 包含环境配置和服务启动功能
echo "===================================="
echo "员工管理系统后端部署脚本"
echo "===================================="

# 检查是否以root用户运行（仅在需要安装系统包时）
if [ "$(id -u)" != "0" ]; then
   echo "注意：当前不是root用户，无法自动安装系统依赖"
   echo "如果需要自动安装PostgreSQL、Node.js等，请使用 sudo 命令执行此脚本"
   echo "如果这些依赖已安装，可以继续执行..."
   read -p "是否继续执行？(y/n): " continue
   if [ "$continue" != "y" ] && [ "$continue" != "Y" ]; then
     exit 1
   fi
fi

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 检查并安装系统依赖
install_system_deps() {
  echo -e "${YELLOW}检查系统依赖...${NC}"
  
  # 检查Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js 未安装，正在安装...${NC}"
    if command -v apt-get &> /dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
    else
      echo -e "${RED}不支持的包管理器，请手动安装Node.js 20.x${NC}"
      exit 1
    fi
  else
    echo -e "${GREEN}Node.js 已安装${NC}"
  fi
  
  # 检查pnpm
  if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm 未安装，正在安装...${NC}"
    npm install -g pnpm
  else
    echo -e "${GREEN}pnpm 已安装${NC}"
  fi
  
  # 检查PostgreSQL
  if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL 未安装，正在安装...${NC}"
    if command -v apt-get &> /dev/null; then
      apt-get install -y postgresql postgresql-contrib
      systemctl start postgresql 2>/dev/null || true
      systemctl enable postgresql 2>/dev/null || true
    else
      echo -e "${RED}不支持的包管理器，请手动安装PostgreSQL${NC}"
      exit 1
    fi
  else
    echo -e "${GREEN}PostgreSQL 已安装${NC}"
  fi
  
  # 检查Redis
  if ! command -v redis-server &> /dev/null; then
    echo -e "${YELLOW}Redis 未安装，正在安装...${NC}"
    if command -v apt-get &> /dev/null; then
      apt-get install -y redis-server
      systemctl start redis-server 2>/dev/null || true
      systemctl enable redis-server 2>/dev/null || true
    else
      echo -e "${YELLOW}Redis 安装失败，但这不是必需的（仅用于性能监控）${NC}"
    fi
  else
    echo -e "${GREEN}Redis 已安装${NC}"
  fi
}

# 配置PostgreSQL数据库
setup_database() {
  echo -e "${YELLOW}配置PostgreSQL数据库...${NC}"
  
  # 检查数据库是否存在
  if command -v psql &> /dev/null; then
    # 尝试创建数据库和用户
    sudo -u postgres psql -c "CREATE DATABASE employee_management;" 2>/dev/null || echo -e "${YELLOW}数据库可能已存在${NC}"
    sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || echo -e "${YELLOW}用户可能已存在${NC}"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE employee_management TO postgres;" 2>/dev/null || true
    sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;" 2>/dev/null || true
    
    echo -e "${GREEN}数据库配置完成${NC}"
  else
    echo -e "${RED}PostgreSQL 不可用，请确保服务已启动${NC}"
  fi
}

# 安装项目依赖
install_deps() {
  echo -e "${YELLOW}安装项目依赖...${NC}"
  pnpm install --prod
  echo -e "${GREEN}依赖安装完成${NC}"
}

# 检查并创建.env文件
setup_env_file() {
  if [ ! -f ".env" ]; then
    echo -e "${YELLOW}.env文件不存在，正在创建...${NC}"
    cat > .env << EOL
# 数据库连接配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_management
DB_USER=postgres
DB_PASSWORD=postgres

# Redis配置（用于缓存和性能监控）
REDIS_HOST=localhost
REDIS_PORT=6379

# 服务器配置
PORT=3000
NODE_ENV=production

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# 日志级别
LOG_LEVEL=info

# 性能监控配置
ENABLE_PERFORMANCE_LOGGING=true
MAX_LOG_AGE_DAYS=7
EOL
    echo -e "${GREEN}.env文件创建完成${NC}"
  else
    echo -e "${GREEN}.env文件已存在${NC}"
  fi
}

# 初始化数据库结构
init_database() {
  echo -e "${YELLOW}初始化数据库结构...${NC}"
  node scripts/init_db.js
  echo -e "${GREEN}数据库结构初始化完成${NC}"
}

# 填充测试数据
seed_database() {
  echo -e "${YELLOW}填充测试数据...${NC}"
  node scripts/seed_data.js
  echo -e "${GREEN}测试数据填充完成${NC}"
}

# 主函数
main() {
  # 显示版本信息
  echo -e "${GREEN}检查Node.js和pnpm版本...${NC}"
  node -v 2>/dev/null || echo -e "${RED}Node.js 未安装${NC}"
  pnpm -v 2>/dev/null || echo -e "${RED}pnpm 未安装${NC}"
  
  # 执行各个步骤
  install_system_deps
  setup_database
  install_deps
  setup_env_file
  init_database
  seed_database
  
  # 显示成功提示
  echo -e "${GREEN}====================================${NC}"
  echo -e "${GREEN}初始化完成！${NC}"
  echo -e "${GREEN}====================================${NC}"
  echo -e "${GREEN}后端环境已成功初始化${NC}"
  echo -e "${GREEN}数据库结构已创建${NC}"
  echo -e "${GREEN}测试数据已填充${NC}"
  echo
  echo -e "${YELLOW}现在可以启动后端服务：${NC}"
  echo -e "${CYAN}npm run dev${NC}"
  echo -e "${YELLOW}或${NC}"
  echo -e "${CYAN}node app.js${NC}"
}

# 执行主函数
main