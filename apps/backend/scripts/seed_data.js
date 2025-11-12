const { Client } = require('pg');
const dotenv = require('dotenv');
const winston = require('../utils/logger');

dotenv.config();

// 创建数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// 生成随机日期的函数
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 格式化日期为YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// 生成随机姓名的函数（增强版，支持生成更多不重复的姓名）
function generateName(index = 0) {
  const firstNames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴',
                     '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗',
                     '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹',
                     '彭', '曾', '肖', '田', '董', '袁', '潘', '于', '蒋', '蔡',
                     '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈',
                     '姚', '卢', '姜', '崔', '钟', '谭', '陆', '汪', '范', '金',
                     '石', '廖', '贾', '夏', '韦', '付', '方', '白', '邹', '孟',
                     '熊', '秦', '邱', '江', '尹', '薛', '闫', '段', '雷', '侯',
                     '龙', '史', '陶', '黎', '贺', '顾', '毛', '郝', '龚', '邵',
                     '万', '钱', '严', '覃', '武', '戴', '莫', '孔', '向', '汤'];
  
  const lastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '强', '磊', '军', '洋', 
                     '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平',
                     '刚', '龙', '飞', '宇', '宁', '峰', '鹏', '浩', '波', '辉',
                     '斌', '晶', '莹', '雪', '霜', '露', '雷', '霆', '晨', '曦'];
  
  // 中文姓名对应的拼音
  const firstNamePinyin = ['zhang', 'wang', 'li', 'zhao', 'liu', 'chen', 'yang', 'huang', 'zhou', 'wu',
                           'xu', 'sun', 'ma', 'zhu', 'hu', 'guo', 'he', 'gao', 'lin', 'luo',
                           'zheng', 'liang', 'xie', 'song', 'tang', 'xu', 'han', 'feng', 'deng', 'cao',
                           'peng', 'zeng', 'xiao', 'tian', 'dong', 'yuan', 'pan', 'yu', 'jiang', 'cai',
                           'yu', 'du', 'ye', 'cheng', 'su', 'wei', 'lv', 'ding', 'ren', 'shen',
                           'yao', 'lu', 'jiang', 'cui', 'zhong', 'tan', 'lu', 'wang', 'fan', 'jin',
                           'shi', 'liao', 'jia', 'xia', 'wei', 'fu', 'fang', 'bai', 'zou', 'meng',
                           'xiong', 'qin', 'qiu', 'jiang', 'yin', 'xue', 'yan', 'duan', 'lei', 'hou',
                           'long', 'shi', 'tao', 'li', 'he', 'gu', 'mao', 'hao', 'gong', 'shao',
                           'wan', 'qian', 'yan', 'qin', 'wu', 'dai', 'mo', 'kong', 'xiang', 'tang'];
  
  const lastNamePinyin = ['wei', 'fang', 'na', 'xiuying', 'min', 'jing', 'qiang', 'lei', 'jun', 'yang', 
                         'yong', 'yan', 'jie', 'juan', 'tao', 'ming', 'chao', 'xiulan', 'xia', 'ping',
                         'gang', 'long', 'fei', 'yu', 'ning', 'feng', 'peng', 'hao', 'bo', 'hui',
                         'bin', 'jing', 'ying', 'xue', 'shuang', 'lu', 'lei', 'ting', 'chen', 'xi'];
  
  // 使用index来确保更多的组合可能性
  const firstNameIndex = (index % firstNames.length + Math.floor(index / firstNames.length) % 5) % firstNames.length;
  const lastNameIndex = (index % lastNames.length + Math.floor(index / lastNames.length) % 3) % lastNames.length;
  
  return {
    firstName: firstNames[firstNameIndex],
    lastName: lastNames[lastNameIndex],
    firstNamePinyin: firstNamePinyin[firstNameIndex],
    lastNamePinyin: lastNamePinyin[lastNameIndex]
  };
}

// 生成随机邮箱的函数
function generateEmail(firstNamePinyin, lastNamePinyin, index) {
  // 使用UUID-like的方式确保唯一性
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${firstNamePinyin}${lastNamePinyin}${index}_${randomPart}@example.com`;
}

// 生成随机手机号的函数
function generatePhone() {
  return '1' + Math.floor(Math.random() * 9000000000 + 1000000000);
}

// 生成随机时间的函数
function getRandomTime() {
  const hours = Math.floor(Math.random() * 5) + 8; // 8-12点（确保加8小时后不会超出范围）
  const minutes = Math.floor(Math.random() * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
}

// 生成考勤状态（根据实际情况调整概率）
function generateAttendanceStatus() {
  const statuses = [
    { status: 'present', weight: 0.85 },    // 85%正常出勤
    { status: 'late', weight: 0.05 },       // 5%迟到
    { status: 'early_leave', weight: 0.03 }, // 3%早退
    { status: 'absent', weight: 0.04 },      // 4%缺勤
    { status: 'sick_leave', weight: 0.02 },   // 2%病假
    { status: 'annual_leave', weight: 0.01 }  // 1%年假
  ];
  
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (const status of statuses) {
    cumulativeWeight += status.weight;
    if (random <= cumulativeWeight) {
      return status.status;
    }
  }
  
  return 'present'; // 默认正常出勤
}

// 生成考勤记录的函数
function generateAttendanceRecord(employeeId, date, projectIds) {
  const status = generateAttendanceStatus();
  let checkInTime = null;
  let checkOutTime = null;
  let overtimeHours = 0;
  
  // 如果是出勤或迟到，生成打卡时间
  if (status === 'present' || status === 'late') {
    // 生成签到时间
    const baseHour = Math.floor(Math.random() * 5) + 8; // 8-12点
    const checkInHour = status === 'late' ? Math.min(baseHour + 1, 13) : baseHour; // 迟到的话加1小时，但不超过13点
    checkInTime = `${checkInHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`;
    
    // 生成签退时间（签到后8-10小时）
    const workHours = Math.floor(Math.random() * 2) + 8; // 8-10小时工作时间
    const checkOutHour = checkInHour + workHours;
    checkOutTime = `${checkOutHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`;
    
    // 30%的概率有加班
    if (Math.random() > 0.7) {
      overtimeHours = Math.random() * 3 + 1; // 1-4小时
    }
  }
  
  // 随机选择一个项目（80%的概率关联项目）
  const projectId = projectIds.length > 0 && Math.random() > 0.2 ? 
    projectIds[Math.floor(Math.random() * projectIds.length)] : null;
  
  return {
    employeeId,
    projectId,
    attendanceDate: formatDate(date),
    checkInTime,
    checkOutTime,
    status,
    overtimeHours
  };
}

// 数据填充函数
async function seedDatabase() {
  let client;
  
  try {
    // 连接数据库
    client = new Client(dbConfig);
    await client.connect();
    winston.info(`连接到数据库 ${dbConfig.database} 成功`);
    
    // 开始事务
    await client.query('BEGIN');
    
    try {
      // 1. 填充部门数据
      const departments = [
        { name: '技术部', location: 'A栋3楼' },
        { name: '市场部', location: 'B栋2楼' },
        { name: '人事部', location: 'A栋2楼' },
        { name: '财务部', location: 'C栋1楼' },
        { name: '销售部', location: 'B栋1楼' },
        { name: '客服部', location: 'C栋2楼' },
        { name: '运营部', location: 'A栋1楼' }
      ];
      
      winston.info('开始填充部门数据...');
      for (const dept of departments) {
        await client.query(
          'INSERT INTO departments (department_name, location) VALUES ($1, $2)',
          [dept.name, dept.location]
        );
      }
      
      // 从数据库中获取实际的部门ID
      const { rows: dbDepartments } = await client.query('SELECT department_id FROM departments');
      const departmentIds = dbDepartments.map(dept => dept.department_id);
      
      winston.info(`已填充 ${departmentIds.length} 条部门数据，实际部门ID: ${departmentIds.join(', ')}`);
      
      // 2. 填充职位数据
      const positions = [
        { name: '高级工程师', level: 'P5', description: '负责核心系统开发' },
        { name: '中级工程师', level: 'P4', description: '负责系统功能开发' },
        { name: '初级工程师', level: 'P3', description: '负责基础功能开发' },
        { name: '技术经理', level: 'M3', description: '负责技术团队管理' },
        { name: '产品经理', level: 'P5', description: '负责产品规划和设计' },
        { name: '市场经理', level: 'M2', description: '负责市场策略制定' },
        { name: 'HR专员', level: 'P3', description: '负责招聘和员工管理' },
        { name: '财务主管', level: 'M2', description: '负责财务核算和管理' },
        { name: '销售总监', level: 'M4', description: '负责销售团队管理' },
        { name: '客服专员', level: 'P2', description: '负责客户服务' }
      ];
      
      winston.info('开始填充职位数据...');
      for (const pos of positions) {
        await client.query(
          'INSERT INTO positions (position_name, level, description) VALUES ($1, $2, $3)',
          [pos.name, pos.level, pos.description]
        );
      }
      winston.info(`已填充 ${positions.length} 条职位数据`);
      
      // 从数据库中获取实际的职位ID
      const { rows: dbPositions } = await client.query('SELECT position_id FROM positions');
      const positionIds = dbPositions.map(pos => pos.position_id);
      winston.info(`获取到职位ID: ${positionIds.join(', ')}`);
      
      // 3. 填充员工数据（先填充管理人员）
      winston.info('开始填充员工数据...');
      let managerIds = [];
      
      // 先插入管理人员
      for (let i = 0; i < 5; i++) {
        const { firstName, lastName, firstNamePinyin, lastNamePinyin } = generateName();
        const email = generateEmail(firstNamePinyin, lastNamePinyin, i + 1);
        const phone = generatePhone();
        const hireDate = getRandomDate(new Date(2018, 0, 1), new Date(2020, 11, 31));
        const formattedHireDate = formatDate(hireDate);
        const departmentId = departmentIds[Math.floor(Math.random() * departmentIds.length)];
        // 从实际的职位ID中选择前4个作为管理职位
        const managerPositionIds = positionIds.slice(3, 7); // 技术经理、产品经理、市场经理、财务主管
        const positionId = managerPositionIds[Math.floor(Math.random() * managerPositionIds.length)];
        
        const res = await client.query(
          `INSERT INTO employees (
            first_name, last_name, email, phone, hire_date, 
            department_id, position_id, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING employee_id`,
          [firstName, lastName, email, phone, formattedHireDate, departmentId, positionId, 'active']
        );
        
        managerIds.push(res.rows[0].employee_id);
      }
      
      // 更新部门的manager_id
      for (let i = 0; i < departmentIds.length; i++) {
        const managerId = managerIds[i % managerIds.length];
        await client.query(
          'UPDATE departments SET manager_id = $1 WHERE department_id = $2',
          [managerId, departmentIds[i]]
        );
      }
      winston.info('已更新所有部门的经理信息');
      
      // 批量插入员工数据
      const batchSize = 500;
      const totalEmployees = 10000; // 设置总员工数量为10000
      const employeeIds = [];
      const employeeStatuses = ['active', 'resigned', 'on_leave', 'inactive'];
      const statusWeights = [0.7, 0.15, 0.1, 0.05]; // 70%在职，15%离职，10%休假，5%停用
      
      console.time('Insert employees');
      for (let batchStart = 5; batchStart < totalEmployees; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, totalEmployees);
        const batchCount = batchEnd - batchStart;
        
        winston.info(`开始插入第 ${batchStart + 1}-${batchEnd} 条员工数据...`);
        
        // 构建批量插入语句
        let values = [];
        let placeholders = [];
        let paramIndex = 1;
        
        for (let i = batchStart; i < batchEnd; i++) {
          const { firstName, lastName, firstNamePinyin, lastNamePinyin } = generateName(i);
          const email = generateEmail(firstNamePinyin, lastNamePinyin, i + 1);
          const phone = generatePhone();
          const hireDate = getRandomDate(new Date(2018, 0, 1), new Date());
          const formattedHireDate = formatDate(hireDate);
          const departmentId = departmentIds[Math.floor(Math.random() * departmentIds.length)];
          // 过滤掉管理职位ID（假设前4个是管理职位）
          const nonManagerPositionIds = positionIds.filter(id => id > 4);
          const positionId = nonManagerPositionIds[Math.floor(Math.random() * nonManagerPositionIds.length)];
          const managerId = managerIds[Math.floor(Math.random() * managerIds.length)];
          
          // 根据权重随机选择员工状态
          const randomValue = Math.random();
          let cumulativeWeight = 0;
          let employeeStatus = 'active'; // 默认在职
          
          for (let j = 0; j < statusWeights.length; j++) {
            cumulativeWeight += statusWeights[j];
            if (randomValue <= cumulativeWeight) {
              employeeStatus = employeeStatuses[j];
              break;
            }
          }
          
          // 添加参数值
          values.push(firstName, lastName, email, phone, formattedHireDate, departmentId, positionId, managerId, employeeStatus);
          
          // 构建占位符
          placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        }
        
        // 执行批量插入
        const query = `
          INSERT INTO employees (
            first_name, last_name, email, phone, hire_date, 
            department_id, position_id, manager_id, status
          ) VALUES ${placeholders.join(', ')}
          RETURNING employee_id
        `;
        
        const res = await client.query(query, values);
        
        // 收集插入的员工ID
        res.rows.forEach(row => {
          employeeIds.push(row.employee_id);
        });
        
        winston.info(`已插入 ${batchCount} 条员工数据`);
      }
      console.timeEnd('Insert employees');
      winston.info(`总共填充 ${employeeIds.length} 条员工数据`);
      
      // 4. 批量填充薪资数据
      console.time('Insert salaries');
      winston.info('开始批量填充薪资数据...');
      
      for (let batchStart = 0; batchStart < employeeIds.length; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, employeeIds.length);
        const batchEmployees = employeeIds.slice(batchStart, batchEnd);
        
        // 构建批量插入语句
        let values = [];
        let placeholders = [];
        let paramIndex = 1;
        
        for (const employeeId of batchEmployees) {
          const basicSalary = Math.floor(Math.random() * 20000) + 8000; // 8000-28000
          const bonus = Math.floor(basicSalary * (Math.random() * 0.3 + 0.1)); // 10%-40%的奖金
          const allowances = Math.floor(Math.random() * 5000) + 1000; // 1000-6000的津贴
          const effectiveDate = getRandomDate(new Date(2023, 0, 1), new Date());
          const formattedEffectiveDate = formatDate(effectiveDate);
          
          values.push(employeeId, basicSalary, bonus, allowances, formattedEffectiveDate);
          placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        }
        
        const query = `
          INSERT INTO salaries (employee_id, basic_salary, bonus, allowances, effective_date)
          VALUES ${placeholders.join(', ')}
        `;
        
        await client.query(query, values);
      }
      
      console.timeEnd('Insert salaries');
      winston.info(`已填充 ${employeeIds.length} 条薪资数据`);
      
      // 5. 填充项目数据
      const projects = [
        { name: '企业资源管理系统', description: '集成HR、财务、项目管理的综合性系统', budget: 1000000 },
        { name: '客户关系管理平台', description: '管理客户信息和销售流程', budget: 800000 },
        { name: '数据可视化分析工具', description: '数据分析和报表生成系统', budget: 600000 },
        { name: '移动办公应用', description: '员工移动办公和协作平台', budget: 700000 },
        { name: '供应链管理系统', description: '采购、库存、物流一体化管理', budget: 900000 },
        { name: '电子商务平台升级', description: '提升用户体验和系统性能', budget: 1200000 },
        { name: '智能考勤系统', description: '人脸识别和自动考勤', budget: 400000 },
        { name: '企业培训平台', description: '员工在线学习和培训管理', budget: 500000 }
      ];
      
      const projectStatuses = ['planning', 'active', 'paused', 'completed'];
      const projectIds = [];
      
      winston.info('开始填充项目数据...');
      for (const project of projects) {
        const startDate = getRandomDate(new Date(2023, 0, 1), new Date());
      const endDate = getRandomDate(new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000), 
                                     new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000));
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
        const status = projectStatuses[Math.floor(Math.random() * projectStatuses.length)];
        
        const res = await client.query(
          `INSERT INTO projects (
            project_name, description, start_date, end_date, status, budget
          ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING project_id`,
          [project.name, project.description, formattedStartDate, formattedEndDate, status, project.budget]
        );
        
        projectIds.push(res.rows[0].project_id);
      }
      
      winston.info(`已填充 ${projects.length} 条项目数据`);
      
      // 6. 填充员工项目关联数据
      const projectRoles = ['项目经理', '开发工程师', '测试工程师', 'UI设计师', '产品经理', '技术顾问'];
      const employeeProjectMap = new Set();
      
      // 获取所有员工的状态信息
      const { rows: allEmployees } = await client.query('SELECT employee_id, status FROM employees');
      const employeeStatusMap = new Map();
      allEmployees.forEach(emp => {
        employeeStatusMap.set(emp.employee_id, emp.status);
      });
      
      // 获取项目状态信息
      const { rows: allProjects } = await client.query('SELECT project_id, status FROM projects');
      const projectStatusMap = new Map();
      allProjects.forEach(proj => {
        projectStatusMap.set(proj.project_id, proj.status);
      });
      
      winston.info('开始填充员工项目关联数据...');
      
      // 按项目状态分配员工
      for (const projectId of projectIds) {
        const projectStatus = projectStatusMap.get(projectId);
        const isActiveProject = projectStatus === 'active' || projectStatus === 'planning' || projectStatus === 'paused';
        
        // 为每个项目分配5-8个员工
        const employeeCount = Math.floor(Math.random() * 4) + 5;
        
        // 根据项目状态筛选合适的员工
        let suitableEmployees = allEmployees.filter(emp => {
          if (isActiveProject) {
            // 正在进行的项目只分配在职员工
            return emp.status === 'active';
          } else {
            // 已完成的项目可以分配任何状态的员工
            return true;
          }
        });
        
        // 随机打乱员工列表
        suitableEmployees = suitableEmployees.sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < Math.min(employeeCount, suitableEmployees.length); i++) {
          const employeeId = suitableEmployees[i].employee_id;
          const key = `${employeeId}-${projectId}`;
          
          if (!employeeProjectMap.has(key)) {
            const role = projectRoles[Math.floor(Math.random() * projectRoles.length)];
            const startDate = getRandomDate(new Date(2023, 0, 1), new Date());
            
            // 根据项目状态和员工状态设置结束日期
            let endDate = null;
            if (projectStatus === 'completed' || projectStatus === 'cancelled') {
              // 已完成的项目有结束日期
              endDate = getRandomDate(startDate, new Date());
            } else if (employeeStatusMap.get(employeeId) === 'resigned') {
              // 离职员工在项目中的结束日期
              endDate = getRandomDate(startDate, new Date());
            }
            
            const contributionHours = Math.floor(Math.random() * 160) + 80; // 80-240小时
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = endDate ? formatDate(endDate) : null;
            
            await client.query(
              `INSERT INTO employee_projects (
                employee_id, project_id, role, start_date, end_date, contribution_hours
              ) VALUES ($1, $2, $3, $4, $5, $6)`,
              [employeeId, projectId, role, formattedStartDate, formattedEndDate, contributionHours]
            );
            
            employeeProjectMap.add(key);
          }
        }
      }
      
      // 确保每个在职员工至少参与1个项目
      const activeEmployees = allEmployees.filter(emp => emp.status === 'active');
      for (const employee of activeEmployees) {
        let hasProject = false;
        
        for (const projectId of projectIds) {
          if (employeeProjectMap.has(`${employee.employee_id}-${projectId}`)) {
            hasProject = true;
            break;
          }
        }
        
        if (!hasProject) {
          // 为在职员工分配一个正在进行的项目
          const activeProjects = allProjects.filter(proj => 
            proj.status === 'active' || proj.status === 'planning' || proj.status === 'paused'
          );
          
          if (activeProjects.length > 0) {
            const projectId = activeProjects[Math.floor(Math.random() * activeProjects.length)].project_id;
            const role = projectRoles[Math.floor(Math.random() * projectRoles.length)];
            const startDate = getRandomDate(new Date(2023, 0, 1), new Date());
            const contributionHours = Math.floor(Math.random() * 100) + 50;
            const formattedStartDate = formatDate(startDate);
            
            await client.query(
              `INSERT INTO employee_projects (
                employee_id, project_id, role, start_date, contribution_hours
              ) VALUES ($1, $2, $3, $4, $5)`,
              [employee.employee_id, projectId, role, formattedStartDate, contributionHours]
            );
          }
        }
      }
      
      winston.info(`已填充 ${employeeProjectMap.size} 条员工项目关联数据`);
      
      // 7. 批量填充考勤数据（增加到一年的考勤记录）
      const attendanceStatuses = ['present', 'absent', 'late', 'early_leave', 'sick_leave', 'annual_leave'];
      const attendanceBatchSize = 1000; // 考勤记录批量大小
      
      console.time('Insert attendances');
      winston.info('开始批量填充考勤数据...');
      const today = new Date();
      
      // 生成一年的考勤记录
      const totalDays = 365;
      const allDates = [];
      
      for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
        const attendanceDate = new Date(today);
        attendanceDate.setDate(today.getDate() - dayOffset);
        const dayOfWeek = attendanceDate.getDay();
        
        // 只为工作日生成考勤记录
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          allDates.push(attendanceDate);
        }
      }
      
      winston.info(`准备生成 ${allDates.length} 天的考勤记录`);
      let totalAttendanceRecords = 0;
      
      // 分批处理员工
      for (let empBatchStart = 0; empBatchStart < employeeIds.length; empBatchStart += 50) {
        const empBatchEnd = Math.min(empBatchStart + 50, employeeIds.length);
        const empBatch = employeeIds.slice(empBatchStart, empBatchEnd);
        
        // 为这一批员工生成所有日期的考勤记录
        const allRecords = [];
        
        for (const employeeId of empBatch) {
          for (const attendanceDate of allDates) {
            // 随机跳过一些记录，让数据更真实
            if (Math.random() > 0.9) continue;
            
            const status = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)];
            let checkInTime = null;
            let checkOutTime = null;
            let overtimeHours = 0;
            
            // 如果是出勤或迟到
            if (status === 'present' || status === 'late') {
              // 生成签到时间
              const baseHour = Math.floor(Math.random() * 5) + 8; // 8-12点
              const checkInHour = status === 'late' ? Math.min(baseHour + 1, 13) : baseHour; // 迟到的话加1小时，但不超过13点
              checkInTime = `${checkInHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`;
              
              // 生成签退时间（签到后8-10小时）
              const workHours = Math.floor(Math.random() * 2) + 8; // 8-10小时工作时间
              const checkOutHour = checkInHour + workHours;
              checkOutTime = `${checkOutHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`;
              
              // 30%的概率有加班
              if (Math.random() > 0.7) {
                overtimeHours = Math.random() * 3 + 1; // 1-4小时
              }
            }
            
            // 随机选择一个项目（80%的概率关联项目）
            const projectId = projectIds.length > 0 && Math.random() > 0.2 ? 
              projectIds[Math.floor(Math.random() * projectIds.length)] : null;
            
            allRecords.push({
              employeeId,
              projectId,
              attendanceDate,
              checkInTime,
              checkOutTime,
              status,
              overtimeHours
            });
          }
        }
        
        // 批量插入考勤记录
        for (let i = 0; i < allRecords.length; i += attendanceBatchSize) {
          const batch = allRecords.slice(i, i + attendanceBatchSize);
          
          let values = [];
          let placeholders = [];
          let paramIndex = 1;
          
          for (const record of batch) {
            const formattedAttendanceDate = formatDate(record.attendanceDate);
            
            values.push(
              record.employeeId,
              record.projectId,
              formattedAttendanceDate,
              record.checkInTime,
              record.checkOutTime,
              record.status,
              record.overtimeHours
            );
            
            placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
          }
          
          const query = `
            INSERT INTO attendances (
              employee_id, project_id, attendance_date, check_in_time, 
              check_out_time, status, overtime_hours
            ) VALUES ${placeholders.join(', ')}
          `;
          
          await client.query(query, values);
          totalAttendanceRecords += batch.length;
        }
        
        winston.info(`已处理 ${empBatchEnd} 名员工的考勤记录`);
      }
      
      console.timeEnd('Insert attendances');
      winston.info(`已填充约 ${totalAttendanceRecords} 条考勤数据`);
      
      // 8. 填充培训数据
      const trainings = [
        { name: '领导力提升培训', trainer: '张教授', location: '培训室A' },
        { name: '技术架构设计', trainer: '李工程师', location: '培训室B' },
        { name: '项目管理实战', trainer: '王经理', location: '会议室C' },
        { name: '团队协作与沟通', trainer: '刘老师', location: '培训室A' },
        { name: '数据分析与可视化', trainer: '陈分析师', location: '培训室B' },
        { name: '客户服务技巧', trainer: '赵主管', location: '会议室D' },
        { name: '创新思维训练', trainer: '杨顾问', location: '创新空间' },
        { name: '时间管理', trainer: '吴讲师', location: '培训室C' }
      ];
      
      const trainingIds = [];
      
      winston.info('开始填充培训数据...');
      for (const training of trainings) {
        const startDate = getRandomDate(new Date(2023, 0, 1), new Date());
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 3) + 1); // 1-4天
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
        
        const res = await client.query(
          `INSERT INTO trainings (
            training_name, description, trainer_name, start_date, end_date, location
          ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING training_id`,
          [training.name, `${training.name} - 提升专业技能`, training.trainer, formattedStartDate, formattedEndDate, training.location]
        );
        
        trainingIds.push(res.rows[0].training_id);
      }
      
      winston.info(`已填充 ${trainings.length} 条培训数据`);
      
      // 9. 填充员工培训关联数据
      const employeeTrainingMap = new Set();
      
      winston.info('开始填充员工培训关联数据...');
      for (const trainingId of trainingIds) {
        // 每个培训有10-20名员工参加
        const participantCount = Math.floor(Math.random() * 11) + 10;
        const shuffledEmployees = [...employeeIds].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < participantCount; i++) {
          const employeeId = shuffledEmployees[i];
          const key = `${employeeId}-${trainingId}`;
          
          if (!employeeTrainingMap.has(key)) {
            const participationDate = getRandomDate(new Date(2023, 0, 1), new Date());
            const score = Math.random() > 0.2 ? Math.floor(Math.random() * 30) + 70 : null; // 70-99分，20%概率无成绩
            const feedback = Math.random() > 0.5 ? '培训内容丰富，收获很大' : null;
            const formattedParticipationDate = formatDate(participationDate);
            
            await client.query(
              `INSERT INTO employee_trainings (
                employee_id, training_id, participation_date, score, feedback
              ) VALUES ($1, $2, $3, $4, $5)`,
              [employeeId, trainingId, formattedParticipationDate, score, feedback]
            );
            
            employeeTrainingMap.add(key);
          }
        }
      }
      
      winston.info(`已填充 ${employeeTrainingMap.size} 条员工培训关联数据`);
      
      // 提交事务
      await client.query('COMMIT');
      winston.info('数据填充完成！');
      
      // 统计总数据量
      const totalRecords = 
        departments.length +
        positions.length +
        employeeIds.length +
        projects.length +
        employeeProjectMap.size +
        totalAttendanceRecords +
        trainings.length +
        employeeTrainingMap.size;
      
      winston.info(`总计填充了约 ${totalRecords} 条数据`);
      
      // 如果数据量不足100000条，添加更多随机数据
      if (totalRecords < 100000) {
        const recordsNeeded = 100000 - totalRecords;
        winston.info(`数据量不足100000条，还需要添加约${recordsNeeded}条数据...`);
        
        // 添加更多考勤记录来达到10万条
        const additionalAttendanceDays = Math.ceil(recordsNeeded / employeeIds.length);
        
        // 批量添加额外的考勤记录
        const additionalAttendanceBatchSize = 5000;
        let additionalRecordsAdded = 0;
        
        console.time('Add extra records');
        
        // 生成更多的日期
        const extraDates = [];
        for (let dayOffset = totalDays; dayOffset < totalDays + additionalAttendanceDays; dayOffset++) {
          const attendanceDate = new Date(today);
          attendanceDate.setDate(today.getDate() - dayOffset);
          extraDates.push(attendanceDate);
        }
        
        // 生成所有额外记录
        const extraRecords = [];
        for (const attendanceDate of extraDates) {
          for (const employeeId of employeeIds) {
            const status = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)];
            let checkInTime = null;
            let checkOutTime = null;
            let overtimeHours = 0;
            
            if (status === 'present' || status === 'late') {
              checkInTime = status === 'late' ? 
                getRandomTime().replace(/^\d+/, (h) => (parseInt(h) + 1).toString()) : 
                getRandomTime();
              checkOutTime = getRandomTime().replace(/^\d+/, (h) => (parseInt(h) + 8).toString());
              
              if (Math.random() > 0.7) {
                overtimeHours = Math.random() * 3 + 1;
              }
            }
            
            const projectId = projectIds.length > 0 && Math.random() > 0.2 ? 
              projectIds[Math.floor(Math.random() * projectIds.length)] : null;
            
            extraRecords.push({
              employeeId,
              projectId,
              attendanceDate,
              checkInTime,
              checkOutTime,
              status,
              overtimeHours
            });
            
            // 如果达到需要的记录数，停止生成
            if (extraRecords.length >= recordsNeeded) {
              break;
            }
          }
          if (extraRecords.length >= recordsNeeded) {
            break;
          }
        }
        
        // 批量插入额外记录
        for (let i = 0; i < extraRecords.length; i += additionalAttendanceBatchSize) {
          const batch = extraRecords.slice(i, i + additionalAttendanceBatchSize);
          
          let values = [];
          let placeholders = [];
          let paramIndex = 1;
          
          for (const record of batch) {
            const formattedAttendanceDate = formatDate(record.attendanceDate);
            
            values.push(
              record.employeeId,
              record.projectId,
              formattedAttendanceDate,
              record.checkInTime,
              record.checkOutTime,
              record.status,
              record.overtimeHours
            );
            
            placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
          }
          
          const query = `
            INSERT INTO attendances (
              employee_id, project_id, attendance_date, check_in_time, 
              check_out_time, status, overtime_hours
            ) VALUES ${placeholders.join(', ')}
          `;
          
          await client.query(query, values);
          additionalRecordsAdded += batch.length;
          
          winston.info(`已添加 ${additionalRecordsAdded}/${extraRecords.length} 条额外数据`);
        }
        
        console.timeEnd('Add extra records');
        winston.info(`总计填充了约 ${totalRecords + additionalRecordsAdded} 条数据`);
      } else {
        winston.info(`数据量已满足要求`);
      }
      
      winston.info(`总计填充了约 ${totalRecords} 条数据`);
      
    } catch (error) {
      // 回滚事务
      await client.query('ROLLBACK');
      winston.error('数据填充失败，事务已回滚:', error);
      throw error;
    }
    
  } catch (error) {
    winston.error('数据填充过程中发生错误:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// 执行数据填充
seedDatabase()
  .then(() => {
    winston.info('数据填充脚本执行完成');
    process.exit(0);
  })
  .catch(error => {
    winston.error('数据填充脚本执行失败:', error);
    process.exit(1);
  });