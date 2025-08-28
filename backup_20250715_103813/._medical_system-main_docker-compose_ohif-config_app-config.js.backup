// 외부 polyfill.io 요청 제거 (네트워크 불필요)
window.disableExternalPolyfills = true;

// Service Worker 사용 중지 (캐시 오류 방지)
window.disableServiceWorker = true;

window.config = {
  routerBasename: '/',
  showStudyList: true,

  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'orthanc-proxy',
        friendlyName: 'Orthanc Proxy',
        wadoUriRoot: 'http://35.225.63.41:8088/dicom-web',
        qidoRoot: 'http://35.225.63.41:8088/dicom-web',
        wadoRoot: 'http://35.225.63.41:8088/dicom-web',



        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        qidoSupportsIncludeField: true,
        omitQuotationForMultipartRequest: true,

        requestOptions: {
          requestFromBrowser: true,
        },
      },
    },
  ],

  defaultDataSourceName: 'dicomweb',

  extensions: [
    '@ohif/extension-default',
    '@ohif/extension-cornerstone',
    '@ohif/extension-measurement-tracking',
    '@ohif/extension-cornerstone-dicom-sr',
  ],

  modes: [
    {
      id: 'default',
      routeName: 'viewer',
      displayName: 'Default Viewer',
      description: 'Basic viewer mode',
      isValidMode: () => true,
      layoutTemplate: ({ numViewports }) => ({
        id: 'default',
        viewportStructure: [
          {
            viewportOptions: {
              toolGroupId: 'default',
              plugin: 'cornerstone',
              displaySetsToDisplay: [0],
            },
          },
        ],
      }),
    },
  ],
};
