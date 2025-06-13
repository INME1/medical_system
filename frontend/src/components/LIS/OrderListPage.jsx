import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const OrderListPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [samples, setSamples] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
    ).toISOString().split('T')[0]);

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

  const displayedOrders = orders.filter(order => order.id.toString().includes(searchKeyword));

  return (
    <div className="relative p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🗂 오더 목록</h2>
        {/* 🔥 ADD: 새로고침 버튼 */}
        <button 
          onClick={handleRefresh}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          🔄 새로고침
        </button>
      </div>

      <div className="absolute top-5 right-5">
        <label className="mr-2">날짜 선택:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>

      <div className="mb-4">
        <label className="mr-2 font-semibold">🔍 Order ID 검색:</label>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="오더 ID 입력"
          className="border px-2 py-1 rounded"
        />
      </div>

      {/* 🔥 ADD: 디버그 정보 표시 */}
      <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
        <strong>🔧 디버그 정보:</strong><br/>
        API URL: {process.env.REACT_APP_API_BASE_URL}orders/<br/>
        선택된 날짜: {selectedDate}<br/>
        전체 주문 수: {orders.length}<br/>
        표시된 주문 수: {displayedOrders.length}
      </div>

      <div className="overflow-x-auto overflow-y-auto h-[400px]">
        <table className="table-fixed w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">오더 ID</th>
              <th className="border px-4 py-2">환자 ID</th>
              <th className="border px-4 py-2">의사 ID</th>
              <th className="border px-4 py-2">검사 타입</th>
              <th className="border px-4 py-2">오더 날짜</th>
              <th className="border px-4 py-2">상태</th>
              <th className="border px-4 py-2">샘플 등록</th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map(order => {
                const hasSample = samples.some(sample => Number(sample.order) === Number(order.id));
                console.log(`🧪 오더 ${order.id}: 샘플 존재 여부 →`, hasSample);
                return (
              <tr key={order.id} className="text-center">
                <td className="border px-4 py-2">{order.id}</td>
                <td className="border px-4 py-2">{order.patient_id}</td>
                <td className="border px-4 py-2">{order.doctor_id}</td>
                <td className="border px-4 py-2">{order.test_type}</td>
                <td className="border px-4 py-2">{order.order_date?.slice(0, 10)}</td>
                <td className="border px-4 py-2">
                 <span 
                  style={{
                    backgroundColor: hasSample ? '#cce5ff' : '#e2e3e5',
                    color: hasSample ? '#004085' : '#383d41',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}
                 >
                  {hasSample ? '샘플 등록됨' : '샘플 미등록'}
                  </span>
                </td>
                <td className="border px-4 py-2">
                  <button
                      onClick={() => navigate(`/lis/sample/new/${order.id}`)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      샘플 등록
                    </button>
                  </td>
                </tr>
                );
              })}
              {displayedOrders.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-gray-500 py-4 text-center">
                    표시할 오더가 없습니다. (전체: {orders.length}개)
                  </td>
                </tr>
              )}
          </tbody>
        </table>
       </div>
    </div>
  );
};

export default OrderListPage;