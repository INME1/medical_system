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
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}orders`);
        const filtered = res.data.filter(order => order.order_date?.slice(0, 10) === selectedDate);
        setOrders(filtered);
      } catch (err) {
        console.error('오더 목록 불러오기 실패:', err);
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

    fetchOrders();
    fetchSamples();
  }, [selectedDate]);

  const displayedOrders = orders.filter(order => order.id.toString().includes(searchKeyword));

  return (
    <div className="relative p-6">
      <h2 className="text-2xl font-bold mb-4">🗂 오더 목록</h2>
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
              const hasSample = samples.some(sample => sample.order === order.id);
              return (
            <tr key={order.id} className="text-center">
              <td className="border px-4 py-2">{order.id}</td>
              <td className="border px-4 py-2">{order.patient_id}</td>
              <td className="border px-4 py-2">{order.doctor_id}</td>
              <td className="border px-4 py-2">{order.test_type}</td>
              <td className="border px-4 py-2">{order.order_date?.slice(0, 10)}</td>
              <td className="border px-4 py-2">
               <span className={
                  hasSample
                    ? "bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    : "bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm"
                }>
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
                <td colSpan="7" className="text-gray-500 py-4 text-center">표시할 오더가 없습니다.</td>
              </tr>
            )}
        </tbody>
      </table>
     </div>
    </div>
  );
};

export default OrderListPage;
