# 员工管理系统后端部署和启动脚本（Windows版本）
# 使用PowerShell执行
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "员工管理系统后端部署脚本（Windows版本）" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# 检查是否以管理员权限运行
function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal $([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

if (-not (Test-Admin)) {
    Write-Host "警告：当前不是管理员权限，无法自动安装系统依赖" -ForegroundColor Yellow
    Write-Host "如果需要自动安装依赖，请以管理员身份运行PowerShell" -ForegroundColor Yellow
    Write-Host "如果这些依赖已安装，可以继续执行..." -ForegroundColor Yellow
    
    $continue = Read-Host "是否继续执行？(y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit
    }
}

# 检查并安装系统依赖
function Install-SystemDeps {
    Write-Host "检查系统依赖..." -ForegroundColor Yellow
    
    # 检查Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "Node.js 未安装，请手动下载并安装 Node.js 20.x" -ForegroundColor Red
        Write-Host "下载地址: https://nodejs.org/en/download/" -ForegroundColor Yellow
        pause
    } else {
        Write-Host "Node.js 已安装" -ForegroundColor Green
    }
    
    # 检查pnpm
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Host "pnpm 未安装，正在安装..." -ForegroundColor Yellow
        npm install -g pnpm
        Write-Host "pnpm 安装完成" -ForegroundColor Green
    } else {
        Write-Host "pnpm 已安装" -ForegroundColor Green
    }
    
    # 检查PostgreSQL
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-Host "PostgreSQL 未安装，请手动下载并安装 PostgreSQL" -ForegroundColor Red
        Write-Host "下载地址: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        Write-Host "安装时请记住设置的密码，后续需要配置" -ForegroundColor Yellow
        pause
    } else {
        Write-Host "PostgreSQL 已安装" -ForegroundColor Green
    }
    
    # 检查Redis
    if (-not (Get-Command redis-server -ErrorAction SilentlyContinue)) {
        Write-Host "Redis 未安装，这不是必需的（仅用于性能监控）" -ForegroundColor Yellow
        Write-Host "如果需要安装，可以从 https://github.com/tporadowski/redis/releases 下载" -ForegroundColor Yellow
    } else {
        Write-Host "Redis 已安装" -ForegroundColor Green
    }
}

# 配置PostgreSQL数据库
function Setup-Database {
    Write-Host "配置PostgreSQL数据库..." -ForegroundColor Yellow
    
    # 检查数据库是否存在
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        # 提示用户输入PostgreSQL的密码
        $pgPassword = Read-Host -Prompt "请输入PostgreSQL的postgres用户密码" -AsSecureString
        $pgPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword))
        
        # 设置环境变量
        $env:PGPASSWORD = $pgPasswordPlain
        
        try {
            # 尝试创建数据库和用户
            Write-Host "尝试创建数据库..." -ForegroundColor Cyan
            psql -U postgres -c "CREATE DATABASE employee_management;" 2>$null
            
            Write-Host "尝试设置用户权限..." -ForegroundColor Cyan
            psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE employee_management TO postgres;" 2>$null
            psql -U postgres -c "ALTER USER postgres WITH SUPERUSER;" 2>$null
            
            Write-Host "数据库配置完成" -ForegroundColor Green
        } catch {
            Write-Host "数据库配置失败: $_" -ForegroundColor Red
            Write-Host "请手动检查PostgreSQL配置" -ForegroundColor Yellow
        } finally {
            # 清理环境变量
            Remove-Item Env:PGPASSWORD
        }
    } else {
        Write-Host "PostgreSQL 不可用，请确保服务已启动" -ForegroundColor Red
    }
}

# 安装项目依赖
function Install-Deps {
    Write-Host "安装项目依赖..." -ForegroundColor Yellow
    pnpm install --prod
    Write-Host "依赖安装完成" -ForegroundColor Green
}

# 检查并创建.env文件
function Setup-EnvFile {
    if (-not (Test-Path ".env")) {
        Write-Host ".env文件不存在，正在创建..." -ForegroundColor Yellow
        
        $envContent = @"
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
"@
        
        $envContent | Out-File ".env" -Encoding utf8
        Write-Host ".env文件创建完成" -ForegroundColor Green
        Write-Host "注意：请根据您的PostgreSQL配置修改.env文件中的数据库密码" -ForegroundColor Yellow
    } else {
        Write-Host ".env文件已存在" -ForegroundColor Green
    }
}

# 初始化数据库结构
function Init-Database {
    Write-Host "初始化数据库结构..." -ForegroundColor Yellow
    node scripts/init_db.js
    Write-Host "数据库结构初始化完成" -ForegroundColor Green
}

# 填充测试数据
function Seed-Database {
    Write-Host "填充测试数据..." -ForegroundColor Yellow
    node scripts/seed_data.js
    Write-Host "测试数据填充完成" -ForegroundColor Green
}

# 主函数
function Main {
    # 显示版本信息
    Write-Host "检查Node.js和pnpm版本..." -ForegroundColor Green
    try {
        node -v
    } catch {
        Write-Host "Node.js 未安装" -ForegroundColor Red
    }
    try {
        pnpm -v
    } catch {
        Write-Host "pnpm 未安装" -ForegroundColor Red
    }
    
    # 执行各个步骤
    Install-SystemDeps
    Setup-Database
    Install-Deps
    Setup-EnvFile
    Init-Database
    Seed-Database
    
    # 显示成功提示
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "初始化完成！" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "后端环境已成功初始化" -ForegroundColor Green
    Write-Host "数据库结构已创建" -ForegroundColor Green
    Write-Host "测试数据已填充" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "现在可以启动后端服务：" -ForegroundColor Yellow
    Write-Host "npm run dev" -ForegroundColor Cyan
    Write-Host "或" -ForegroundColor Yellow
    Write-Host "node app.js" -ForegroundColor Cyan
}

# 执行主函数
Main