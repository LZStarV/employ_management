const swaggerJSDoc = require('swagger-jsdoc');

// Swagger配置选项
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '员工管理系统 API',
      version: '1.0.0',
      description: '员工管理系统后端API文档',
      contact: {
        name: 'API支持',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: '开发服务器'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Employee: {
          type: 'object',
          properties: {
            employee_id: {
              type: 'integer',
              description: '员工ID'
            },
            first_name: {
              type: 'string',
              description: '姓氏'
            },
            last_name: {
              type: 'string',
              description: '名字'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱地址'
            },
            phone: {
              type: 'string',
              description: '电话号码'
            },
            hire_date: {
              type: 'string',
              format: 'date',
              description: '入职日期'
            },
            status: {
              type: 'string',
              enum: ['active', 'resigned', 'on_leave', 'inactive'],
              description: '员工状态'
            }
          }
        },
        Department: {
          type: 'object',
          properties: {
            department_id: {
              type: 'integer',
              description: '部门ID'
            },
            department_name: {
              type: 'string',
              description: '部门名称'
            },
            location: {
              type: 'string',
              description: '部门位置'
            }
          }
        },
        Project: {
          type: 'object',
          properties: {
            project_id: {
              type: 'integer',
              description: '项目ID'
            },
            project_name: {
              type: 'string',
              description: '项目名称'
            },
            description: {
              type: 'string',
              description: '项目描述'
            },
            status: {
              type: 'string',
              enum: ['planning', 'active', 'paused', 'completed'],
              description: '项目状态'
            }
          }
        }
      }
    }
  },
  // 扫描API文档的路径
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;