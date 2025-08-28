// frontend/src/setupProxy.js (수정된 버전)
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 🔥 모든 API 요청을 Django 백엔드로 프록시
  app.use(
    '/api',  // 모든 /api로 시작하는 요청
    createProxyMiddleware({
      target: 'http://localhost:8000',  // Django 백엔드 주소
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'  // /api는 그대로 유지
      },
      onError: (err, req, res) => {
        console.error('프록시 에러:', err);
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('프록시 요청:', req.method, req.url, '→', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('프록시 응답:', proxyRes.statusCode, req.url);
      }
    })
  );

  // 🔥 별도로 필요한 특정 API들
  app.use(
    '/openmrs',
    createProxyMiddleware({
      target: 'http://localhost:8082',  // OpenMRS 직접 접근
      changeOrigin: true,
      pathRewrite: { '^/openmrs': '/openmrs/ws/rest/v1' },
    })
  );
};