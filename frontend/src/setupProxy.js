// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // EMR orders API (/api/orders) → 백엔드(8000번)로 포워딩
  app.use(
    '/api/orders',
    createProxyMiddleware({
      target: 'http://35.225.63.41:8000',
      changeOrigin: true,
      pathRewrite: { '^/api/orders': '/api/orders' },
    })
  );

  // EMR lis-requests API → 백엔드(8000번)
  app.use(
    '/api/lis-requests',
    createProxyMiddleware({
      target: 'http://35.225.63.41:8000',
      changeOrigin: true,
      pathRewrite: { '^/api/lis-requests': '/api/lis-requests' },
    })
  );

  // (필요하다면) OpenMRS 조회 API → 8082번
  app.use(
    '/openmrs',
    createProxyMiddleware({
      target: 'http://35.225.63.41:8082',
      changeOrigin: true,
      pathRewrite: { '^/openmrs': '/openmrs/ws/rest/v1' },
    })
  );
};
