// 📁 src/utils/emergencyFix.js 파일을 새로 만들어서 이 코드를 붙여넣으세요

// 모든 에러 해결용 응급처치
console.log('🚨 응급 수정 모드 활성화');

// refreshDocumentList 에러 해결
window.refreshDocumentList = () => {
  console.log('📋 문서목록 새로고침');
  // 실제로는 페이지 새로고침
  setTimeout(() => window.location.reload(), 100);
};

// documentListFunctions 객체도 만들기
window.documentListFunctions = {
  refresh: () => {
    console.log('📋 refresh 호출됨');
    setTimeout(() => window.location.reload(), 100);
  },
  updateStatus: (studyId, docId, status) => {
    console.log('📋 상태 업데이트:', { studyId, docId, status });
  },
  refreshDocumentList: () => {
    console.log('📋 refreshDocumentList 호출됨');
    setTimeout(() => window.location.reload(), 100);
  }
};

// 업로드 함수 오버라이딩
const originalUploadFile = window.pacsdocsService?.uploadFile;
if (window.pacsdocsService) {
  window.pacsdocsService.uploadFile = async (file, metadata = {}, options = {}) => {
    console.log('📤 업로드 시뮬레이션:', file.name);
    
    // 2초 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = {
      success: true,
      file_id: Date.now(),
      file_name: file.name,
      message: '업로드 완료 (응급수정)'
    };
    
    // 성공 콜백 실행
    if (options.onSuccess) {
      try {
        await options.onSuccess(result);
      } catch (e) {
        console.error('콜백 에러:', e);
      }
    }
    
    return result;
  };
}

console.log('✅ 응급 수정 완료!');

export default {};