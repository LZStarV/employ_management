const Router = require('koa-router');
const { koaSwagger } = require('koa2-swagger-ui');
const swaggerSpec = require('../../config/swagger');

const router = new Router({ prefix: '/api' });

// Swagger UI 路由
router.get('/docs', koaSwagger({
  routePrefix: false,
  swaggerOptions: {
    spec: swaggerSpec
  }
}));

// Swagger JSON 路由
router.get('/docs.json', async (ctx) => {
  ctx.set('Content-Type', 'application/json');
  ctx.body = swaggerSpec;
});

module.exports = router;