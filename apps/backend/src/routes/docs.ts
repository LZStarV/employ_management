import Router from 'koa-router';
import { Context } from 'koa';
import { koaSwagger } from 'koa2-swagger-ui';
import swaggerSpec from '../../config/swagger';

const router = new Router({ prefix: '/api' });

// Swagger UI 路由
router.get('/docs', koaSwagger({
  routePrefix: false,
  swaggerOptions: {
    spec: swaggerSpec
  }
}));

// Swagger JSON 路由
router.get('/docs.json', async (ctx: Context) => {
  ctx.set('Content-Type', 'application/json');
  ctx.body = swaggerSpec;
});

export default router;