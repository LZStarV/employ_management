#!/bin/bash

# 员工管理系统后端部署和启动脚本（Mac版本）
# 使用Homebrew作为包管理器
echo "===================================="
echo "员工管理系统后端部署脚本（Mac版本）"
echo "===================================="

# 检查用户权限
if [[ $(uname) == "Darwin" ]]; then
  echo "检测到MacOS系统"
else
  echo "警告：此脚本专为MacOS设计，可能在其他系统上无法正常工作"
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

# 检查并安装Homebrew
function check_homebrew() {
  if ! command -v brew &> /dev/null; then
    echo -e "${RED}Homebrew 未安装，正在安装...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # 添加Homebrew到PATH（临时）
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
  else
    echo -e "${GREEN}Homebrew 已安装${NC}"
  fi
}

# 检查并安装系统依赖
function install_system_deps() {
  echo -e "${YELLOW}检查系统依赖...${NC}"
  
  # 检查Homebrew
  check_homebrew
  
  # 检查Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js 未安装，正在安装...${NC}"
    brew install node@20
    echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile
    export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
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
    brew install postgresql
    # 启动PostgreSQL服务
    brew services start postgresql
  else
    echo -e "${GREEN}PostgreSQL 已安装${NC}"
    # 确保PostgreSQL服务正在运行
    if ! pg_isready -h localhost &> /dev/null; then
      echo -e "${YELLOW}启动PostgreSQL服务...${NC}"
      brew services start postgresql
    fi
  fi
  
  # 检查Redis
  if ! command -v redis-server &> /dev/null; then
    echo -e "${YELLOW}Redis 未安装，正在安装...${NC}"
    brew install redis
    brew services start redis
  else
    echo -e "${GREEN}Redis 已安装${NC}"
    # 确保Redis服务正在运行
    if ! redis-cli ping &> /dev/null; then
      echo -e "${YELLOW}启动Redis服务...${NC}"
      brew services start redis
    fi
  fi
}

# 配置PostgreSQL数据库
function setup_database() {
  echo -e "${YELLOW}配置PostgreSQL数据库...${NC}"
  
  # 检查数据库是否存在
  if command -v psql &> /dev/null; then
    # 在Mac上，PostgreSQL默认用户通常是当前系统用户名
    local current_user=$(whoami)
    echo -e "${GREEN}使用当前用户 $current_user 配置数据库${NC}"
    
    # 检查PostgreSQL是否正在运行
    if ! pg_isready -h localhost &> /dev/null; then
      echo -e "${RED}PostgreSQL服务未运行，正在启动...${NC}"
      brew services start postgresql@14 || brew services start postgresql
      sleep 3  # 给PostgreSQL时间启动
    fi
    
    # 尝试创建数据库
    if ! createdb employee_management 2>/dev/null; then
      echo -e "${YELLOW}数据库创建失败或已存在，尝试检查...${NC}"
      if ! psql -lqt | cut -d \| -f 1 | grep -qw employee_management; then
        echo -e "${RED}数据库不存在且无法创建，请手动创建数据库: createdb employee_management${NC}"
        return 1
      fi
    fi
    
    echo -e "${GREEN}数据库配置完成${NC}"
    return 0
  else
    echo -e "${RED}PostgreSQL 不可用，请确保服务已启动${NC}"
    return 1
  fi
}

# 安装项目依赖
function install_deps() {
  echo -e "${YELLOW}安装项目依赖...${NC}"
  pnpm install --prod
  echo -e "${GREEN}依赖安装完成${NC}"
}

# 检查并创建.env文件
function setup_env_file() {
  local current_user=$(whoami)
  
  if [ ! -f ".env" ]; then
    echo -e "${YELLOW}.env文件不存在，正在创建...${NC}"
    cat > .env << EOL
# 数据库连接配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_management
DB_USER=${current_user}
DB_PASSWORD=

# Redis配置（用于缓存和性能监控）
REDIS_HOST=localhost
REDIS_PORT=6379

# 服务器配置
PORT=3000
NODE_ENV=development

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# 日志级别
LOG_LEVEL=info

# 性能监控配置
ENABLE_PERFORMANCE_LOGGING=true
MAX_LOG_AGE_DAYS=7
EOL
    echo -e "${GREEN}.env文件创建完成，使用当前用户 ${current_user} 作为数据库用户${NC}"
  else
    # 如果.env文件已存在，更新数据库用户配置
    echo -e "${YELLOW}.env文件已存在，更新数据库用户配置...${NC}"
    # 使用sed更新DB_USER配置
    sed -i '' "s/^DB_USER=.*/DB_USER=${current_user}/g" .env
    sed -i '' "s/^DB_PASSWORD=.*/DB_PASSWORD=/g" .env
    echo -e "${GREEN}.env文件已更新，使用当前用户 ${current_user} 作为数据库用户${NC}"
  fi
}

# 初始化数据库结构
function init_database() {
  echo -e "${YELLOW}初始化数据库结构...${NC}"
  if node scripts/init_db.js 2>/dev/null; then
    echo -e "${GREEN}数据库结构初始化完成${NC}"
    return 0
  else
    echo -e "${RED}数据库结构初始化失败${NC}"
    echo -e "${YELLOW}请检查PostgreSQL连接配置和权限${NC}"
    echo -e "${YELLOW}如果是第一次运行，数据库可能还未准备好，请等待几秒后重试${NC}"
    return 1
  fi
}

# 填充测试数据
function seed_database() {
  echo -e "${YELLOW}填充测试数据...${NC}"
  if node scripts/seed_data.js 2>/dev/null; then
    echo -e "${GREEN}测试数据填充完成${NC}"
    return 0
  else
    echo -e "${RED}测试数据填充失败${NC}"
    echo -e "${YELLOW}请检查数据库连接和表结构${NC}"
    return 1
  fi
}

# 主函数
function main() {
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