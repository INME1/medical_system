// // src > components > utils > saveLog.js

// // src/components/utils/saveLog.js

// import axios from 'axios'

// const API_BASE_URL = 
//   process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') 
//   || 'http://35.225.63.41:8000/api'

// // joinUrl 헬퍼를 인라인 정의합니다.
// const joinUrl = (base, path) =>
//   `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`

// let logCooldownSet = new Set()

// export async function saveLog({
//   category        = 'LIS',
//   step,
//   patient_uuid,
//   patient_id,
//   doctor_uuid,
//   doctor_id,
//   detail          = {}
// }) {
//   const logKey = `${step}-${patient_id || patient_uuid}`
//   if (logCooldownSet.has(logKey)) {
//     console.warn('⏱ 중복 저장 방지:', logKey)
//     return
//   }

//   try {
//     logCooldownSet.add(logKey)
//     setTimeout(() => logCooldownSet.delete(logKey), 3000)

//     const payload = {
//       category,
//       step,
//       patient_uuid,
//       patient_id,
//       doctor_uuid,
//       doctor_id,
//       detail
//     }
//     // 엔드포인트가 /api/logs/create/ 이므로, '/logs/create/' 를 사용
//     const url = joinUrl(API_BASE_URL, '/logs/create/')
//     const res = await axios.post(url, payload)
//     console.log('✅ 로그 저장 성공:', res.data)
//     return res.data

//   } catch (err) {
//     console.error('❌ 로그 저장 실패:', err.response?.data || err.message)
//     throw err
//   }
// }





// // ------------- 기존 코드----------------
// // import axios from 'axios';

// // const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://35.225.63.41:8000/api';

// // const joinUrl = (base, path) => {
// //   return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
// // };

// // let logCooldownSet = new Set();

// // export const saveLog = async ({
// //   patient_id,
// //   doctor_id,
// //   order_id = null,
// //   sample_id = null,
// //   step,
// //   request_detail = '',
// //   result_detail = ''
// // }) => {
// //   const logKey = `${step}-${sample_id || order_id}`;

// //   if (logCooldownSet.has(logKey)) {
// //     console.warn('⏱ 로그 중복 저장 방지됨:', logKey);
// //     return;
// //   }

// //   try {
// //     logCooldownSet.add(logKey);  // 저장 시도 시작
// //     setTimeout(() => logCooldownSet.delete(logKey), 3000);  // 3초 후 해제
  
// //     const payload = {
// //       patient_id,
// //       doctor_id,
// //       order_id,
// //       sample_id,
// //       step,
// //       request_detail,
// //       result_detail
// //     };

// //     const response = await axios.post(joinUrl(API_BASE_URL, '/logs/create/'), payload);
// //     console.log('✅ 로그 저장 성공:', response.data);
// //   } catch (error) {
// //     console.error('❌ 로그 저장 실패:', error.response?.data || error.message);
// //   }
// // };




// src/utils/saveLog.js

import axios from 'axios';

export const saveLog = async (payload) => {
  try {
    // 변경된 POST 엔드포인트로 맞춰주세요
    axios.post('http://35.225.63.41:8000/api/logs/create/', payload);
    console.log('로그 저장 성공');
  } catch (err) {
    console.error('로그 저장 실패:', err);
  }
};

