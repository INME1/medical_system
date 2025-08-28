// pacsapp/src/utils/pacsdocs/pdfGenerator.js

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateFileName } from './documentTypes';

/**
 * HTML 요소를 PDF로 변환하여 다운로드
 * @param {Object} documentData - 문서 데이터
 * @param {string} docFileName - 파일명용 문서 이름
 * @param {string} currentDocument - 현재 문서 타입
 */
export const generatePDF = async (documentData, docFileName, currentDocument) => {
  try {
    // 로딩 상태 표시
    showPDFLoadingState(true);

    // PDF로 변환할 요소 찾기
    const contentElement = document.querySelector('.preview-content');
    if (!contentElement) {
      throw new Error('문서 내용을 찾을 수 없습니다.');
    }

    console.log('📄 PDF 생성 시작:', { 
      patient: documentData.patientName, 
      docType: currentDocument 
    });

    // html2canvas로 고품질 이미지 생성
    const canvas = await html2canvas(contentElement, {
      scale: 2,                    // 고해상도
      useCORS: true,              // CORS 허용
      allowTaint: false,          // 보안
      backgroundColor: '#ffffff', // 배경색
      logging: false,             // 로그 비활성화
      width: contentElement.scrollWidth,
      height: contentElement.scrollHeight,
      // 추가 옵션들
      onclone: (clonedDoc) => {
        // 클론된 문서에서 버튼들 숨기기
        const buttons = clonedDoc.querySelectorAll('.action-buttons, .btn');
        buttons.forEach(btn => btn.style.display = 'none');
      }
    });

    // PDF 생성
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // A4 크기 계산 (210mm x 297mm)
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // 여백 10mm
    const imgWidth = pdfWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 페이지 분할 처리
    let heightLeft = imgHeight;
    let position = margin; // 상단 여백

    // 첫 페이지 추가
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, '', 'FAST');
    heightLeft -= (pdfHeight - (margin * 2)); // 여백 제외

    // 추가 페이지가 필요한 경우
    while (heightLeft >= 0) {
      pdf.addPage();
      position = heightLeft - imgHeight + margin;
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= (pdfHeight - (margin * 2));
    }

    // 메타데이터 추가
    addPDFMetadata(pdf, documentData, currentDocument);

    // 파일명 생성
    const fileName = generateFileName(
      documentData.patientName || '환자', 
      currentDocument
    );

    // PDF 저장
    pdf.save(fileName);

    console.log('✅ PDF 저장 완료:', fileName);
    
    // 성공 알림
    showSuccessAlert(fileName);

  } catch (error) {
    console.error('❌ PDF 생성 실패:', error);
    showErrorAlert(error.message);
  } finally {
    // 로딩 상태 해제
    showPDFLoadingState(false);
  }
};

/**
 * PDF에 메타데이터 추가
 * @param {jsPDF} pdf - PDF 객체
 * @param {Object} documentData - 문서 데이터
 * @param {string} docType - 문서 타입
 */
const addPDFMetadata = (pdf, documentData, docType) => {
  try {
    const now = new Date();
    
    pdf.setProperties({
      title: `${documentData.patientName || '환자'}_${docType}`,
      subject: `의료 문서 - ${docType}`,
      author: '의료영상정보시스템',
      creator: 'PACS Document System',
      producer: 'jsPDF',
      keywords: `의료문서,${docType},${documentData.patientName || ''}`,
      creationDate: now,
      modDate: now
    });

    console.log('📋 PDF 메타데이터 추가 완료');
  } catch (error) {
    console.warn('⚠️ PDF 메타데이터 추가 실패:', error);
  }
};

/**
 * PDF 생성 로딩 상태 표시/해제
 * @param {boolean} isLoading - 로딩 상태
 */
const showPDFLoadingState = (isLoading) => {
  const saveButton = document.querySelector('.btn-primary:nth-child(2)');
  if (!saveButton) return;

  if (isLoading) {
    saveButton.textContent = '📄 생성 중...';
    saveButton.disabled = true;
    saveButton.classList.add('loading');
  } else {
    saveButton.textContent = '💾 PDF 저장';
    saveButton.disabled = false;
    saveButton.classList.remove('loading');
  }
};

/**
 * 성공 알림 표시
 * @param {string} fileName - 생성된 파일명
 */
const showSuccessAlert = (fileName) => {
  alert(`✅ PDF 저장이 완료되었습니다!\n\n파일명: ${fileName}\n\n다운로드 폴더를 확인해주세요.`);
};

/**
 * 에러 알림 표시
 * @param {string} errorMessage - 에러 메시지
 */
const showErrorAlert = (errorMessage) => {
  alert(`❌ PDF 생성 중 오류가 발생했습니다.\n\n오류 내용: ${errorMessage}\n\n다시 시도해주세요.`);
};

/**
 * PDF 생성 가능 여부 확인
 * @returns {boolean} 생성 가능 여부
 */
export const canGeneratePDF = () => {
  const contentElement = document.querySelector('.preview-content');
  return !!contentElement && contentElement.innerHTML.trim().length > 0;
};

/**
 * PDF 미리보기 (새 창에서 열기)
 * @param {Object} documentData - 문서 데이터
 * @param {string} docFileName - 파일명
 * @param {string} currentDocument - 문서 타입
 */
export const previewPDF = async (documentData, docFileName, currentDocument) => {
  try {
    const contentElement = document.querySelector('.preview-content');
    if (!contentElement) {
      throw new Error('문서 내용을 찾을 수 없습니다.');
    }

    // 미리보기 창 열기
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    const content = contentElement.innerHTML;
    
    const previewHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PDF 미리보기 - ${documentData.patientName}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Malgun Gothic', sans-serif;
              margin: 20px;
              line-height: 1.6;
              color: #333;
            }
            @media print {
              body { margin: 0; }
            }
            @page { margin: 20mm; size: A4; }
          </style>
        </head>
        <body>
          ${content}
          <div style="margin-top: 30px; text-align: right; font-size: 12px; color: #666;">
            <p>발급일시: ${new Date().toLocaleString('ko-KR')}</p>
            <p>발급기관: 의료영상정보시스템</p>
          </div>
        </body>
      </html>
    `;
    
    previewWindow.document.write(previewHTML);
    previewWindow.document.close();
    
  } catch (error) {
    console.error('PDF 미리보기 실패:', error);
    alert('PDF 미리보기 중 오류가 발생했습니다.');
  }
};