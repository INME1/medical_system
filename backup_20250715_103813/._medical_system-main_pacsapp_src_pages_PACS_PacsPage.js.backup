import React from 'react';

const PacsPage = () => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', padding: 0, margin: 0 }}>
      {/* 로고 숨기는 오버레이 - 아래로 5mm 확장 */}
      <div style={{
        position: 'absolute',
        top: '5px',
        left: '5px',
        width: '240px',
        height: '70px',
        backgroundColor: '#343a40',
        zIndex: 1000,
        pointerEvents: 'none'
      }} />
      
      {/* 새로운 로고/텍스트 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '25px',
        color: 'white',
        fontSize: '23px',
        fontWeight: 'bold',
        zIndex: 1001,
        pointerEvents: 'none'
      }}>
        LaCID PACS System
      </div>
      
      <iframe
        src="http://35.225.63.41:8042"
        title="LaCID PACS Viewer"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
      />
    </div>
  );
};

export default PacsPage;

// import React from 'react';

// const PacsPage = () => {
//   console.log('PacsPage 컴포넌트 렌더링됨!');
  
//   return (
//     <div style={{ width: '100%', height: '100%', padding: 0, margin: 0 }}>
//       <iframe
//         src="http://35.225.63.41:8042"
//         title="Orthanc PACS Viewer"
//         onLoad={() => console.log('iframe 로드 완료!')}
//         style={{
//           width: '100%',
//           height: '100%',
//           border: 'none',
//           display: 'block'
//         }}
//       />
//     </div>
//   );
// };

// export default PacsPage;
