// pages/OHIFViewer/index.js
import React from 'react';
import OHIFViewerComponent from '../../components/ohifviewer'; // 실제 OHIF 컴포넌트 import

const OHIFViewer = () => {
  return (
    <div style={{ width: '100%', height: '100%', padding: 0, margin: 0 }}>
      <OHIFViewerComponent />
    </div>
  );
};

export default OHIFViewer;

// pages/OHIFViewer/index.js
// import React from 'react';
// import OHIFViewerComponent from '../../components/ohifviewer';

// const OHIFViewer = () => {
//   return (
//     <div style={{ 
//       position: 'fixed',
//       top: 0,
//       left: 0,
//       width: '100vw',
//       height: '100vh',
//       zIndex: 9999,
//       backgroundColor: '#000'
//     }}>
//       <OHIFViewerComponent />
//     </div>
//   );
// };

// export default OHIFViewer;