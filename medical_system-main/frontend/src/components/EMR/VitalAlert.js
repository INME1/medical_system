import { useState, useEffect } from "react";

export default function VitalAlertBanner({ patientUuid }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientUuid) return;

    // 로그 추가
    console.log("patientUuid:", patientUuid);

    const fetchAlert = async () => {
      try {
        const res = await fetch(`/api/ai/vital-alert/?patient=${patientUuid}`);
        const data = await res.json();
        setResult(data);
        setError(null);
      } catch (err) {
        setError("API 요청 실패");
        setResult(null);
      }
    };

    fetchAlert();
  }, [patientUuid]);

  if (error) {
    return (
      <div style={{ backgroundColor: "#ffe5e5", padding: 10, color: "#900" }}>
        ⚠️ {error}
      </div>
    );
  }

  if (!result) return null;

  const alerts = [];

  if (result.temp_alert) alerts.push(`체온 ${result.temp}°C`);
  if (result.spo2_alert) alerts.push(`SpO₂ ${result.spo2}%`);
  if (result.pulse_alert) alerts.push(`맥박 ${result.pulse}`);
  if (result.bp_alert) alerts.push(`혈압 ${result.bp}`);
  if (result.resp_alert) alerts.push(`호흡수 ${result.resp}`);

  const hasAlert = alerts.length > 0;

  return (
    <div
      style={{
        backgroundColor: hasAlert ? "#ffcccc" : "#e0ffe0",
        color: hasAlert ? "#900" : "#060",
        padding: "12px 20px",
        fontWeight: "bold",
        borderBottom: "2px solid #ccc",
      }}
    >
      {hasAlert ? (
        <>🚨 이상 징후: {alerts.join(", ")}</>
      ) : (
        <>모든 바이탈이 정상입니다</>
      )}
    </div>
  );
}
