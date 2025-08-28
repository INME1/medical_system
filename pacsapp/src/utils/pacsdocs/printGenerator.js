// pacsapp/src/utils/pacsdocs/printGenerator.js

/**
 * 문서를 인쇄용 창에서 출력
 * @param {Object} documentData - 문서 데이터
 * @param {string} docDisplayName - 표시용 문서 이름
 */
export const printDocument = (documentData, docDisplayName) => {
  try {
    console.log('🖨️ 인쇄 시작:', { 
      patient: documentData.patientName, 
      document: docDisplayName 
    });

    // 인쇄할 내용 가져오기
    const contentElement = document.querySelector('.preview-content');
    if (!contentElement) {
      throw new Error('인쇄할 문서 내용을 찾을 수 없습니다.');
    }

    const printContent = contentElement.innerHTML;

    // 인쇄용 창 생성
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    
    if (!printWindow) {
      throw new Error('팝업 차단으로 인해 인쇄 창을 열 수 없습니다. 팝업을 허용해주세요.');
    }

    // 인쇄용 HTML 생성
    const printHTML = generatePrintHTML(printContent, documentData, docDisplayName);
    
    // 인쇄 창에 내용 작성
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // 인쇄 실행
    printWindow.onload = () => {
      // 약간의 지연 후 인쇄 (페이지 로딩 완료 대기)
      setTimeout(() => {
        printWindow.print();
        
        // 인쇄 후 창 닫기
        printWindow.onafterprint = () => {
          printWindow.close();
        };
        
        // 인쇄 취소된 경우를 위한 타이머
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            printWindow.close();
          }
        }, 10000); // 10초 후 자동 닫기
        
      }, 500);
    };
    
    console.log('✅ 인쇄 요청 완료');
    
  } catch (error) {
    console.error('❌ 인쇄 실패:', error);
    alert(`인쇄 중 오류가 발생했습니다.\n\n오류 내용: ${error.message}`);
  }
};

/**
 * 인쇄용 HTML 생성
 * @param {string} content - 문서 내용
 * @param {Object} documentData - 문서 데이터
 * @param {string} docDisplayName - 문서 표시명
 * @returns {string} 인쇄용 HTML
 */
const generatePrintHTML = (content, documentData, docDisplayName) => {
  const currentDateTime = new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>인쇄 - ${documentData.patientName || '환자'} - ${docDisplayName}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${getPrintStyles()}
        </style>
      </head>
      <body>
        <!-- 인쇄용 헤더 -->
        <div class="print-header">
          <div class="hospital-info">
            <h1>🏥 의료영상정보시스템</h1>
            <p>Medical Imaging Information System</p>
          </div>
          <div class="print-info">
            <p><strong>인쇄일시:</strong> ${currentDateTime}</p>
            <p><strong>문서유형:</strong> ${docDisplayName}</p>
          </div>
        </div>

        <!-- 문서 내용 -->
        <div class="print-content">
          ${content}
        </div>

        <!-- 인쇄용 푸터 -->
        <div class="print-footer">
          <div class="footer-left">
            <p>본 문서는 전자의무기록시스템에서 출력되었습니다.</p>
            <p>무단 복제 및 위조를 금지합니다.</p>
          </div>
          <div class="footer-right">
            <p>발급기관: 의료영상정보시스템</p>
            <p>시스템 버전: v2.0</p>
          </div>
        </div>

        <!-- 페이지 하단 -->
        <div class="page-bottom">
          <p>- 문서 끝 -</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * 인쇄용 CSS 스타일 반환
 * @returns {string} CSS 스타일
 */
const getPrintStyles = () => {
  return `
    /* 기본 스타일 */
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    
    /* 인쇄용 헤더 */
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .hospital-info h1 {
      margin: 0 0 5px 0;
      font-size: 20px;
      color: #2c3e50;
      font-weight: bold;
    }
    
    .hospital-info p {
      margin: 0;
      font-size: 12px;
      color: #666;
      font-style: italic;
    }
    
    .print-info {
      text-align: right;
    }
    
    .print-info p {
      margin: 2px 0;
      font-size: 11px;
      color: #666;
    }
    
    /* 문서 내용 */
    .print-content {
      min-height: 400px;
      margin-bottom: 30px;
    }
    
    .print-content h1,
    .print-content h2,
    .print-content h3 {
      color: #2c3e50;
      page-break-after: avoid;
    }
    
    .print-content h1 {
      font-size: 18px;
      text-align: center;
      margin: 20px 0;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    
    .print-content h2 {
      font-size: 16px;
      margin: 15px 0 10px 0;
    }
    
    .print-content h3 {
      font-size: 14px;
      margin: 12px 0 8px 0;
    }
    
    .print-content p {
      margin: 6px 0;
      font-size: 12px;
    }
    
    .print-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: avoid;
    }
    
    .print-content table,
    .print-content th,
    .print-content td {
      border: 1px solid #ddd;
    }
    
    .print-content th,
    .print-content td {
      padding: 8px 10px;
      text-align: left;
      font-size: 11px;
    }
    
    .print-content th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    
    /* 서명 영역 */
    .signature-section {
      margin-top: 30px;
      padding: 15px;
      border: 1px solid #ccc;
      background-color: #f9f9f9;
      page-break-inside: avoid;
    }
    
    .signature-box {
      height: 60px;
      border: 1px solid #999;
      margin: 10px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      color: #666;
      font-style: italic;
      font-size: 11px;
    }
    
    /* 푸터 */
    .print-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #ddd;
      padding-top: 15px;
      margin-top: 30px;
      font-size: 10px;
      color: #666;
    }
    
    .footer-left,
    .footer-right {
      flex: 1;
    }
    
    .footer-right {
      text-align: right;
    }
    
    .footer-left p,
    .footer-right p {
      margin: 2px 0;
    }
    
    .page-bottom {
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
      color: #999;
    }
    
    /* 페이지 설정 */
    @page {
      margin: 20mm;
      size: A4;
    }
    
    /* 인쇄 전용 스타일 */
    @media print {
      body {
        margin: 0;
        padding: 10px;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      
      .print-header,
      .print-content,
      .print-footer {
        page-break-inside: avoid;
      }
      
      /* 불필요한 요소 숨기기 */
      .no-print,
      .action-buttons,
      .btn {
        display: none !important;
      }
      
      /* 페이지 나누기 제어 */
      h1, h2, h3 {
        page-break-after: avoid;
      }
      
      table {
        page-break-inside: avoid;
      }
      
      tr {
        page-break-inside: avoid;
      }
    }
    
    /* 반응형 (화면 미리보기용) */
    @media screen and (max-width: 768px) {
      body {
        padding: 10px;
      }
      
      .print-header {
        flex-direction: column;
        gap: 10px;
      }
      
      .print-info {
        text-align: left;
      }
    }
  `;
};

/**
 * 현재 페이지를 직접 인쇄 (간단한 방법)
 */
export const printCurrentPage = () => {
  try {
    // 인쇄하지 않을 요소들 숨기기
    const elementsToHide = document.querySelectorAll('.action-buttons, .btn, .section-header');
    const originalDisplay = [];
    
    elementsToHide.forEach((el, index) => {
      originalDisplay[index] = el.style.display;
      el.style.display = 'none';
    });
    
    // 인쇄 실행
    window.print();
    
    // 원래 상태로 복원
    elementsToHide.forEach((el, index) => {
      el.style.display = originalDisplay[index];
    });
    
    console.log('✅ 페이지 인쇄 완료');
    
  } catch (error) {
    console.error('❌ 페이지 인쇄 실패:', error);
    alert('인쇄 중 오류가 발생했습니다.');
  }
};

/**
 * 인쇄 가능 여부 확인
 * @returns {boolean} 인쇄 가능 여부
 */
export const canPrint = () => {
  const contentElement = document.querySelector('.preview-content');
  return !!contentElement && contentElement.innerHTML.trim().length > 0;
};