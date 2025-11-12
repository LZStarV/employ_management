# 员工管理系统数据库设计

## 实体关系图

```
Employee (1) <-> (1) Salary
Department (1) <-> (N) Employee
Position (1) <-> (N) Employee
Employee (N) <-> (M) Project [通过EmployeeProject表]
Employee (N) <-> (M) Training [通过EmployeeTraining表]
Project (1) <-> (N) Attendance
```

## 表结构设计

### 1. Department（部门表）
```sql
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    manager_id INTEGER REFERENCES employees(employee_id),
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Position（职位表）
```sql
CREATE TABLE positions (
    position_id SERIAL PRIMARY KEY,
    position_name VARCHAR(100) NOT NULL,
    level VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Employee（员工表）
```sql
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    hire_date DATE NOT NULL,
    department_id INTEGER REFERENCES departments(department_id),
    position_id INTEGER REFERENCES positions(position_id),
    manager_id INTEGER REFERENCES employees(employee_id),
    address TEXT,
    birth_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为department表的manager_id添加外键约束（需要在employee表创建后添加）
ALTER TABLE departments ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES employees(employee_id);
```

### 4. Salary（薪资表）
```sql
CREATE TABLE salaries (
    salary_id SERIAL PRIMARY KEY,
    employee_id INTEGER UNIQUE REFERENCES employees(employee_id),
    basic_salary DECIMAL(10, 2) NOT NULL,
    bonus DECIMAL(10, 2) DEFAULT 0,
    allowances DECIMAL(10, 2) DEFAULT 0,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Project（项目表）
```sql
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'planning',
    budget DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. EmployeeProject（员工项目关联表）
```sql
CREATE TABLE employee_projects (
    employee_project_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    project_id INTEGER REFERENCES projects(project_id),
    role VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    contribution_hours DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, project_id)
);
```

### 7. Attendance（考勤表）
```sql
CREATE TABLE attendances (
    attendance_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    project_id INTEGER REFERENCES projects(project_id),
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    status VARCHAR(20) DEFAULT 'present',
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. Training（培训表）
```sql
CREATE TABLE trainings (
    training_id SERIAL PRIMARY KEY,
    training_name VARCHAR(100) NOT NULL,
    description TEXT,
    trainer_name VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9. EmployeeTraining（员工培训关联表）
```sql
CREATE TABLE employee_trainings (
    employee_training_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    training_id INTEGER REFERENCES trainings(training_id),
    participation_date DATE NOT NULL,
    score DECIMAL(5, 2),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, training_id)
);
```

## 索引设计

```sql
-- 为常用查询字段创建索引
CREATE INDEX idx_employees_last_name ON employees(last_name);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_position_id ON employees(position_id);
CREATE INDEX idx_salaries_employee_id ON salaries(employee_id);
CREATE INDEX idx_attendances_employee_date ON attendances(employee_id, attendance_date);
CREATE INDEX idx_employee_projects_employee ON employee_projects(employee_id);
CREATE INDEX idx_employee_projects_project ON employee_projects(project_id);
CREATE INDEX idx_employee_trainings_employee ON employee_trainings(employee_id);
CREATE INDEX idx_employee_trainings_training ON employee_trainings(training_id);
```

## 关系说明

1. **1-1关系**：Employee（员工）和Salary（薪资）- 每个员工有且仅有一个薪资记录
2. **1-N关系**：Department（部门）和Employee（员工）- 一个部门有多个员工
3. **1-N关系**：Position（职位）和Employee（员工）- 一个职位有多个员工
4. **1-N关系**：Employee（员工）和Employee（员工）- 一个经理管理多个员工（自引用）
5. **N-M关系**：Employee（员工）和Project（项目）- 一个员工可以参与多个项目，一个项目有多个员工参与
6. **N-M关系**：Employee（员工）和Training（培训）- 一个员工可以参加多个培训，一个培训有多个员工参加
7. **1-N关系**：Project（项目）和Attendance（考勤）- 一个项目有多个考勤记录

## 业务逻辑说明

1. **员工管理**：包括员工信息的增删改查、部门调动、职位变动等
2. **薪资管理**：薪资的设置、调整、查询等
3. **项目管理**：项目的创建、员工分配、进度跟踪等
4. **考勤管理**：打卡记录、出勤统计、加班记录等
5. **培训管理**：培训课程的安排、员工参与记录、成绩管理等
6. **部门管理**：部门信息管理、部门人员统计等
7. **性能分析**：多用户并发访问性能记录和分析

## 事务支持点

1. 员工信息更新与薪资调整的联动操作
2. 项目创建与员工分配的原子操作
3. 批量员工数据导入
4. 考勤记录的批量处理
5. 培训课程的创建与员工分配

## 跨表查询示例

1. 查询员工及其所在部门和职位信息
2. 查询员工参与的所有项目
3. 查询项目的所有参与员工
4. 查询员工的考勤记录统计
5. 查询部门的人员分布和薪资统计