import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './OrderListPage.css'; 
import SlidePanel from './LisSlidePanel';
import SampleForm from './SampleForm';

const OrderListPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [samples, setSamples] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showSamplePanel, setShowSamplePanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localISO = new Date(today.getTime() - offset).toISOString().split('T')[0];
    return localISO;
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // 🔥 FIX: URL 경로 수정 - 슬래시 추가
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}orders/`);
        console.log('📥 Orders API 응답:', res.data);
        
        // 🔥 FIX: 백엔드 응답 구조에 맞게 수정 - res.data.data 사용
        const ordersArray = res.data.data || res.data || [];
        console.log('📋 주문 배열:', ordersArray);
        
        const filtered = ordersArray.filter(order => order.order_date?.slice(0, 10) === selectedDate);
        setOrders(filtered);
        console.log('📋 필터된 주문 목록:', filtered);
      } catch (err) {
        console.error('❌ 오더 목록 불러오기 실패:', err);
        console.error('🌐 요청 URL:', `${process.env.REACT_APP_API_BASE_URL}orders/`);
        if (err.response) {
          console.error('📄 응답 데이터:', err.response.data);
          console.error('📊 응답 상태:', err.response.status);
        }
      }
    };
    
    const fetchSamples = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}samples/`);
        setSamples(res.data);  // order ID 기준 비교용
      } catch (err) {
        console.error('샘플 목록 불러오기 실패:', err);
      }
    };

    console.log('🔍 선택된 날짜:', selectedDate);
    console.log('🌐 API Base URL:', process.env.REACT_APP_API_BASE_URL);
    
    fetchOrders();
    fetchSamples();
  }, [selectedDate]);

  // 🔥 ADD: 수동 새로고침 함수
  const handleRefresh = async () => {
    try {
      console.log('🔄 수동 새로고침 시작...');
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}orders/`);
      console.log('📥 새로고침 응답:', res.data);
      
      // 🔥 FIX: 백엔드 응답 구조에 맞게 수정
      const ordersArray = res.data.data || res.data || [];
      const filtered = ordersArray.filter(order => order.order_date?.slice(0, 10) === selectedDate);
      setOrders(filtered);
      
      alert(`✅ 새로고침 완료! ${filtered.length}개 주문 표시중`);
    } catch (err) {
      console.error('❌ 새로고침 실패:', err);
      alert('❌ 새로고침 실패');
    }
  };

  const displayedOrders = orders.filter(order => order.order_id.toString().includes(searchKeyword));

return (
    <div className="order-page-container">
      <div className="order-header">
        <h2>🗂 오더 목록</h2>
        <button onClick={handleRefresh}>🔄 새로고침</button>
      </div>

      <div className="order-controls">
        <label>
          날짜 선택:
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
        <label>
          🔍 Order ID 검색:
          <input
            type="text"
            placeholder="오더 ID 입력"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </label>
      </div>

      <div className="debug-toggle">
        <span onClick={() => setShowDebug(!showDebug)} className="debug-icon">
          <span style={{ fontSize: '18px', marginRight: '6px' }}>ℹ️</span>
          디버그 정보 {showDebug ? '숨기기' : '보기'}
        </span>
      </div>

      {showDebug && (
        <div className="order-debug">
          <div>API URL: {process.env.REACT_APP_API_BASE_URL}orders/</div>
          <div>선택된 날짜: {selectedDate}</div>
          <div>전체 주문 수: {orders.length}</div>
          <div>표시된 주문 수: {displayedOrders.length}</div>
        </div>
      )}

      <div className="order-table-wrapper">
        <table className="order-table">
          <thead>
            <tr>
              <th>오더 ID</th>
              <th>환자 ID</th>
              <th>의사 ID</th>
              <th>검사 타입</th>
              <th>오더 날짜</th>
              <th>상태</th>
              <th>샘플 등록</th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((order) => {
              const hasSample = samples.some(
                (sample) => Number(sample.order) === Number(order.order_id)
              );
              return (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.patient_id}</td>
                  <td>{order.doctor_id}</td>
                  <td>{order.panel}</td>
                  <td>{order.order_date?.slice(0, 10)}</td>
                  <td>
                    <span className={hasSample ? "status-chip registered" : "status-chip pending"}>
                      {hasSample ? '샘플 등록됨' : '샘플 미등록'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="sample-button"
                      onClick={() => {
                        setSelectedOrderId(order.order_id);
                        setShowSamplePanel(true);
                      }}
                    >
                      ➕ 샘플 등록
                    </button>
                  </td>
                </tr>
                );
              })}
            {displayedOrders.length === 0 && (
              <tr>
                <td colSpan="7" className="no-orders">표시할 오더가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlidePanel isOpen={showSamplePanel} onClose={() => setShowSamplePanel(false)}>
        <SampleForm orderId={selectedOrderId} />
      </SlidePanel>
    </div>
  );
};


export default OrderListPage;