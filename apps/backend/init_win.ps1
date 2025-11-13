# Employee Management System Backend Deployment Script (Windows Version)
# Execute using PowerShell
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Employee Management System Backend Deployment Script (Windows Version)" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if running with administrator privileges
function Test-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal $([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

if (-not (Test-Admin)) {
    Write-Host "Warning: Not running with administrator privileges, cannot automatically install system dependencies" -ForegroundColor Yellow
    Write-Host "If you need to automatically install dependencies, please run PowerShell as administrator" -ForegroundColor Yellow
    Write-Host "If these dependencies are already installed, you can continue..." -ForegroundColor Yellow
    
    $continue = Read-Host "Continue execution? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit
    }
}

# Check and install system dependencies
function Install-SystemDeps {
    Write-Host "Checking system dependencies..." -ForegroundColor Yellow
    
    # Check Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "Node.js is not installed, please manually download and install Node.js 20.x" -ForegroundColor Red
        Write-Host "Download URL: https://nodejs.org/en/download/" -ForegroundColor Yellow
        pause
    } else {
        Write-Host "Node.js is installed" -ForegroundColor Green
    }
    
    # Check pnpm
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Host "pnpm is not installed, installing..." -ForegroundColor Yellow
        npm install -g pnpm
        Write-Host "pnpm installation completed" -ForegroundColor Green
    } else {
        Write-Host "pnpm is installed" -ForegroundColor Green
    }
    
    # Check PostgreSQL
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-Host "PostgreSQL is not installed, please manually download and install PostgreSQL" -ForegroundColor Red
        Write-Host "Download URL: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        Write-Host "Remember the password you set during installation, it will be needed for configuration" -ForegroundColor Yellow
        pause
    } else {
        Write-Host "PostgreSQL is installed" -ForegroundColor Green
    }
    
    # Check Redis
    if (-not (Get-Command redis-server -ErrorAction SilentlyContinue)) {
        Write-Host "Redis is not installed, it's not required (only used for performance monitoring)" -ForegroundColor Yellow
        Write-Host "If you need to install it, you can download from https://github.com/tporadowski/redis/releases" -ForegroundColor Yellow
    } else {
        Write-Host "Redis is installed" -ForegroundColor Green
    }
}

# Configure PostgreSQL database
function Setup-Database {
    Write-Host "Configuring PostgreSQL database..." -ForegroundColor Yellow
    
    # Check if database exists
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        # Prompt user for PostgreSQL password
        $pgPassword = Read-Host -Prompt "Please enter PostgreSQL postgres user password" -AsSecureString
        $pgPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword))
        
        # Set environment variable
        $env:PGPASSWORD = $pgPasswordPlain
        
        try {
            # Try to create database and user
            Write-Host "Attempting to create database..." -ForegroundColor Cyan
            psql -U postgres -c "CREATE DATABASE employee_management;" 2>$null
            
            Write-Host "Attempting to set user privileges..." -ForegroundColor Cyan
            psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE employee_management TO postgres;" 2>$null
            psql -U postgres -c "ALTER USER postgres WITH SUPERUSER;" 2>$null
            
            Write-Host "Database configuration completed" -ForegroundColor Green
        } catch {
            Write-Host "Database configuration failed: $_" -ForegroundColor Red
            Write-Host "Please manually check PostgreSQL configuration" -ForegroundColor Yellow
        } finally {
            # Clean up environment variable
            Remove-Item Env:PGPASSWORD
        }
    } else {
        Write-Host "PostgreSQL is not available, please ensure the service is started" -ForegroundColor Red
    }
}

# Install project dependencies
function Install-Deps {
    Write-Host "Installing project dependencies..." -ForegroundColor Yellow
    try {
        pnpm install --prod
        Write-Host "Dependencies installation completed" -ForegroundColor Green
    } catch {
        Write-Host "Dependencies installation failed: $_" -ForegroundColor Red
    }
}

# Check and create .env file
function Setup-EnvFile {
    if (-not (Test-Path ".env")) {
        Write-Host ".env file does not exist, creating..." -ForegroundColor Yellow
        
        $envContent = @"
# Database connection configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_management
DB_USER=postgres
DB_PASSWORD=postgres

# Redis configuration (for caching and performance monitoring)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server configuration
PORT=3000
NODE_ENV=production

# JWT configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Log level
LOG_LEVEL=info

# Performance monitoring configuration
ENABLE_PERFORMANCE_LOGGING=true
MAX_LOG_AGE_DAYS=7
"@
        
        $envContent | Out-File ".env" -Encoding utf8
        Write-Host ".env file created successfully" -ForegroundColor Green
        Write-Host "Note: Please modify the database password in the .env file according to your PostgreSQL configuration" -ForegroundColor Yellow
    } else {
        Write-Host ".env file already exists" -ForegroundColor Green
    }
}

# Initialize database structure
function Init-Database {
    Write-Host "Initializing database structure..." -ForegroundColor Yellow
    try {
        node scripts/init_db.js
        Write-Host "Database structure initialization completed" -ForegroundColor Green
    } catch {
        Write-Host "Database structure initialization failed: $_" -ForegroundColor Red
        Write-Host "Please check PostgreSQL connection and permissions" -ForegroundColor Yellow
    }
}

# Seed test data
function Seed-Database {
    Write-Host "Seeding test data..." -ForegroundColor Yellow
    try {
        node scripts/seed_data.js
        Write-Host "Test data seeding completed" -ForegroundColor Green
    } catch {
        Write-Host "Test data seeding failed: $_" -ForegroundColor Red
        Write-Host "Please check database connection and table structure" -ForegroundColor Yellow
    }
}

# Main function
function Main {
    # Display version information
    Write-Host "Checking Node.js and pnpm versions..." -ForegroundColor Green
    try {
        node -v
    } catch {
        Write-Host "Node.js is not installed" -ForegroundColor Red
    }
    try {
        pnpm -v
    } catch {
        Write-Host "pnpm is not installed" -ForegroundColor Red
    }
    
    # Execute each step
    Install-SystemDeps
    Setup-Database
    Install-Deps
    Setup-EnvFile
    Init-Database
    Seed-Database
    
    # Display success message
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "Initialization completed!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "Backend environment has been successfully initialized" -ForegroundColor Green
    Write-Host "Database structure has been created" -ForegroundColor Green
    Write-Host "Test data has been populated" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "You can now start the backend service:" -ForegroundColor Yellow
    Write-Host "npm run dev" -ForegroundColor Cyan
    Write-Host "or" -ForegroundColor Yellow
    Write-Host "node app.js" -ForegroundColor Cyan
}

# Execute main function
Main