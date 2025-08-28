import React from 'react';
import './ResultModal.css';
import ShapContributionChart from './ShapContributionChart';
import ShapSummaryText from './ShapSummaryText';

const CdssResultModal = ({ data, onClose, isModal = true }) => {
  if (!data) return null;

  const interpretPrediction = (value) => {
    const finalValue = value === null || value === undefined || value === '' ? 0 : value;
    if (finalValue === 1 || finalValue === true || finalValue === "1") return '🔴 이상 소견';
    if (finalValue === 0 || finalValue === false || finalValue === "0") return '🟢 정상';
    return String(finalValue);
  };

  const testTypeLabelMap = {
    CBC: 'CBC',
    CRP: 'CRP',
    ABGA: 'ABGA',
    'NT-proBNP': 'NT-proBNP',
    'D-Dimer': 'D-Dimer',
  };

  return (
    <div className={isModal ? 'modal-overlay' : ''}>
      <div className={isModal ? 'modal-content' : 'ai-result-box'}>
        {isModal && (
          <button className="modal-close" onClick={onClose}>✖</button>
        )}

        <p><strong>검사 종류:</strong> {testTypeLabelMap[data.test_type] || data.test_type}</p>
        <p>
          <strong>예측 결과:</strong>{' '}
          <span className="prediction-text">{interpretPrediction(data.prediction)}</span>
        </p>

        {data.explanation && (
          <p><strong>📌 </strong> {data.explanation}</p>
        )}

        {/* ✅ value가 리스트 형태로 들어올 때 처리 */}
        <table className="ai-result-table">
          <thead>
            <tr><th>항목</th><th>값</th></tr>
          </thead>
          <tbody>
            {Object.entries(data.results || {}).map(([key, value], idx) => (
              <tr key={idx}>
                <td>{value.component_name || `항목 ${key}`}</td>
                <td>{value.value !== undefined && value.value !== null ? value.value : '-'} {value.unit ?? ''}</td>
              </tr>
            ))}
          </tbody>

        </table>

        {/* ✅ SHAP 시각화 */}
        {data.shap_data && Object.keys(data.shap_data).length > 0 && (
          <ShapContributionChart shapData={data.shap_data} />
        )}
        {data.shap_data && data.probability && Object.keys(data.shap_data).length > 0 && (
          <ShapSummaryText predictionProb={data.probability} shapData={data.shap_data} />
        )}
      </div>
    </div>
  );
};

export default CdssResultModal;
