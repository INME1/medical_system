import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProviderList = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  const baseUrl = process.env.REACT_APP_DJANGO_API_URL || 'http://localhost:8000/api/integration';
  const PROVIDER_API_URL = `${baseUrl}/openmrs/providers/`;



  const fetchProviders = async (query = '') => {
    setLoading(true);
    try {
      const response = await axios.get(PROVIDER_API_URL, {
        params: query ? { q: query } : {}
      });
      setProviders(response.data.results || response.data);  // 구조에 따라 조정
    } catch (err) {
      console.error('❌ Provider 목록 조회 실패', err);
      setError('의료진 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();  // 초기 로딩
  }, []);

  const handleSearch = () => {
    fetchProviders(searchQuery);
  };

  return (
    <div>
      <h2>의료진 목록</h2>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="의료진 이름 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch}>검색</button>
      </div>
      {loading ? (
        <p>불러오는 중...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <ul>
          {providers.map((p) => (
            <li key={p.uuid}>
              <strong>{p.display}</strong> ({p.person?.gender || '성별 미상'}, {p.person?.birthdate || '생년월일 미상'})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProviderList;
