import React from 'react';

const ShapSummaryText = ({ predictionProb, shapData }) => {
  if (!shapData || Object.keys(shapData).length === 0) return null;

  // ✅ shapData가 dict일 경우 처리
  const entries = Object.entries(shapData).map(([key, value]) => ({
    name: key,
    value: value
  }));

  const topK = 3;
  const sorted = entries
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, topK);

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3 className="text-md font-semibold mb-1">📌 주요 기여 변수 요약</h3>
      <p style={{ marginBottom: '0.5rem' }}>
        🔵 이상 소견 확률: {Math.round(predictionProb * 100)}%
      </p>
      {sorted.map((item, i) => (
        <p key={i}>
          ➤ {item.name} {item.value >= 0 ? '+' : ''}{(item.value * 100).toFixed(1)}%
        </p>
      ))}
    </div>
  );
};

export default ShapSummaryText;
