
// /**
//  * KST 기준 현재 날짜 반환 (YYYY-MM-DD 형식)
//  */
// export const getTodayKST = () => {
//   const now = new Date();
  
//   // 🔧 Intl API를 사용하여 정확한 KST 시간 계산
//   const kstDate = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
  
//   const year = kstDate.getFullYear();
//   const month = String(kstDate.getMonth() + 1).padStart(2, '0');
//   const day = String(kstDate.getDate()).padStart(2, '0');
  
//   const result = `${year}-${month}-${day}`;
  
//   console.log('🕐 getTodayKST:', result);
//   return result;
// };

// /**
//  * 브라우저 로컬 시간을 서버로 보낼 형식으로 변환
//  * Django는 TIME_ZONE='Asia/Seoul'로 설정되어 있으므로 
//  * naive datetime으로 보내면 자동으로 KST로 해석됨
//  */
// export const formatDateTimeForServer = (dateTimeInput) => {
//   if (!dateTimeInput) return null;
  
//   console.log('🕐 formatDateTimeForServer 입력:', dateTimeInput, typeof dateTimeInput);
  
//   try {
//     let dt;
    
//     if (typeof dateTimeInput === 'string') {
//       // "2025-06-26T15:30" 형식의 문자열
//       if (dateTimeInput.includes('T')) {
//         // 'Z'나 '+09:00' 등의 시간대 정보 제거
//         const cleanStr = dateTimeInput.replace(/[Z\+\-]\d{2}:?\d{0,2}$/, '');
//         dt = new Date(cleanStr);
//       } else {
//         dt = new Date(dateTimeInput);
//       }
//     } else if (dateTimeInput instanceof Date) {
//       dt = dateTimeInput;
//     } else {
//       console.error('❌ 지원하지 않는 날짜 형식:', dateTimeInput);
//       return null;
//     }
    
//     // NaN 체크
//     if (isNaN(dt.getTime())) {
//       console.error('❌ 잘못된 날짜:', dateTimeInput);
//       return null;
//     }
    
//     // 🔧 중요: 브라우저의 로컬 시간을 그대로 사용
//     // Django TIME_ZONE='Asia/Seoul'이므로 naive datetime으로 보내면 KST로 해석됨
//     const year = dt.getFullYear();
//     const month = String(dt.getMonth() + 1).padStart(2, '0');
//     const day = String(dt.getDate()).padStart(2, '0');
//     const hours = String(dt.getHours()).padStart(2, '0');
//     const minutes = String(dt.getMinutes()).padStart(2, '0');
//     const seconds = String(dt.getSeconds()).padStart(2, '0');
    
//     const result = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    
//     console.log('🕐 formatDateTimeForServer 결과:', result);
//     return result;
    
//   } catch (error) {
//     console.error('❌ formatDateTimeForServer 오류:', error);
//     return null;
//   }
// };

// /**
//  * 서버에서 받은 시간을 브라우저 표시용으로 변환
//  */
// export const formatServerTimeToLocal = (serverTime) => {
//   if (!serverTime) return null;
  
//   try {
//     // 서버에서 받은 시간은 이미 KST 기준
//     const dt = new Date(serverTime);
    
//     if (isNaN(dt.getTime())) {
//       console.error('❌ 잘못된 서버 시간:', serverTime);
//       return null;
//     }
    
//     return dt;
//   } catch (error) {
//     console.error('❌ formatServerTimeToLocal 오류:', error);
//     return null;
//   }
// };

// /**
//  * datetime-local input용 형식 변환
//  */
// export const formatForDateTimeInput = (dateTime) => {
//   if (!dateTime) return '';
  
//   try {
//     const dt = dateTime instanceof Date ? dateTime : new Date(dateTime);
    
//     if (isNaN(dt.getTime())) {
//       return '';
//     }
    
//     const year = dt.getFullYear();
//     const month = String(dt.getMonth() + 1).padStart(2, '0');
//     const day = String(dt.getDate()).padStart(2, '0');
//     const hours = String(dt.getHours()).padStart(2, '0');
//     const minutes = String(dt.getMinutes()).padStart(2, '0');
    
//     return `${year}-${month}-${day}T${hours}:${minutes}`;
//   } catch (error) {
//     console.error('❌ formatForDateTimeInput 오류:', error);
//     return '';
//   }
// };

// /**
//  * 종료 시간 계산
//  */
// export const getEndTime = (startTime, durationMinutes) => {
//   if (!startTime || !durationMinutes) return '';
  
//   try {
//     const [hours, minutes] = startTime.split(':').map(Number);
//     const totalMinutes = hours * 60 + minutes + parseInt(durationMinutes);
//     const endHours = Math.floor(totalMinutes / 60);
//     const endMins = totalMinutes % 60;
    
//     return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
//   } catch (error) {
//     console.error('❌ getEndTime 오류:', error);
//     return '';
//   }
// };

// /**
//  * 모달리티별 기본 소요시간 반환
//  */
// export const getDefaultDuration = (modality) => {
//   const durations = {
//     'CR': 10,  // X-ray
//     'CT': 30,  // CT
//     'MR': 60,  // MRI
//     'US': 20,  // 초음파
//     'NM': 45,  // Nuclear Medicine
//     'PT': 90,  // PET
//     'DX': 15,  // Digital Radiography
//     'XA': 45,  // Angiography
//     'MG': 20   // Mammography
//   };
  
//   return durations[modality] || 30;
// };

// /**
//  * DateTime에서 시간 부분만 추출 (HH:MM 형식)
//  */
// export const extractTimeFromDateTime = (dateTime) => {
//   if (!dateTime) return '';
  
//   try {
//     const dt = dateTime instanceof Date ? dateTime : new Date(dateTime);
    
//     if (isNaN(dt.getTime())) {
//       return '';
//     }
    
//     const hours = String(dt.getHours()).padStart(2, '0');
//     const minutes = String(dt.getMinutes()).padStart(2, '0');
    
//     return `${hours}:${minutes}`;
//   } catch (error) {
//     console.error('❌ extractTimeFromDateTime 오류:', error);
//     return '';
//   }
// };

// /**
//  * 날짜를 YYYY-MM-DD 형식으로 포맷
//  */
// export const formatDate = (date) => {
//   if (!date) return '';
  
//   try {
//     const dt = date instanceof Date ? date : new Date(date);
    
//     if (isNaN(dt.getTime())) {
//       return '';
//     }
    
//     const year = dt.getFullYear();
//     const month = String(dt.getMonth() + 1).padStart(2, '0');
//     const day = String(dt.getDate()).padStart(2, '0');
    
//     return `${year}-${month}-${day}`;
//   } catch (error) {
//     console.error('❌ formatDate 오류:', error);
//     return '';
//   }
// };

// /**
//  * 시간을 HH:MM 형식으로 포맷
//  */
// export const formatTime = (date) => {
//   if (!date) return '';
  
//   try {
//     const dt = date instanceof Date ? date : new Date(date);
    
//     if (isNaN(dt.getTime())) {
//       return '';
//     }
    
//     const hours = String(dt.getHours()).padStart(2, '0');
//     const minutes = String(dt.getMinutes()).padStart(2, '0');
    
//     return `${hours}:${minutes}`;
//   } catch (error) {
//     console.error('❌ formatTime 오류:', error);
//     return '';
//   }
// };

// /**
//  * 시간 디버깅 함수
//  */
// export const debugTime = (time, label = '') => {
//   console.log(`🕐 [DEBUG] ${label}:`, {
//     original: time,
//     type: typeof time,
//     parsed: time instanceof Date ? time : new Date(time),
//     formatted: formatForDateTimeInput(time),
//     serverFormat: formatDateTimeForServer(time)
//   });
// };

// // 개발환경에서 전역 노출
// if (process.env.NODE_ENV === 'development') {
//   window.timeUtils = {
//     getTodayKST,
//     formatDateTimeForServer,
//     formatServerTimeToLocal,
//     formatForDateTimeInput,
//     extractTimeFromDateTime,
//     formatDate,
//     formatTime,
//     getEndTime,
//     getDefaultDuration,
//     debugTime
//   };
//   console.log('🔧 timeUtils가 window.timeUtils로 노출됨');
// }

// timeUtils.js - 시간대 문제 해결 버전

// timeUtils.js - 시간대 문제 해결 버전

/**
 * KST 기준 현재 날짜 반환 (YYYY-MM-DD 형식)
 */
export const getTodayKST = () => {
  const now = new Date();
  
  // 🔧 Intl API를 사용하여 정확한 KST 시간 계산
  const kstDate = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
  
  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  
  const result = `${year}-${month}-${day}`;
  
  console.log('🕐 getTodayKST:', result);
  return result;
};

/**
 * ✅ Django에서 받은 UTC 시간을 KST로 올바르게 변환
 * Django는 항상 UTC로 시간을 보내므로, 이를 KST로 변환해야 함
 */
export const convertDjangoTimeToKST = (djangoTimeString) => {
  if (!djangoTimeString) return null;
  
  try {
    // Django에서 받은 시간은 UTC 기준이므로 명시적으로 UTC로 파싱
    let utcTime;
    
    if (djangoTimeString.includes('Z')) {
      // 이미 Z가 있으면 그대로 사용
      utcTime = new Date(djangoTimeString);
    } else if (djangoTimeString.includes('+') || djangoTimeString.match(/-\d{2}:\d{2}$/)) {
      // 이미 시간대 정보가 있으면 그대로 사용
      utcTime = new Date(djangoTimeString);
    } else {
      // naive datetime이면 UTC로 가정하고 Z 추가
      utcTime = new Date(djangoTimeString + 'Z');
    }
    
    if (isNaN(utcTime.getTime())) {
      console.error('❌ 잘못된 Django 시간 형식:', djangoTimeString);
      return null;
    }
    
    // UTC 시간을 KST로 변환 (UTC + 9시간)
    const kstTime = new Date(utcTime.getTime() + (9 * 60 * 60 * 1000));
    
    console.log('🕐 Django 시간 변환:', {
      original: djangoTimeString,
      utc: utcTime.toISOString(),
      kst: kstTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    });
    
    return kstTime;
    
  } catch (error) {
    console.error('❌ convertDjangoTimeToKST 오류:', error);
    return null;
  }
};

/**
 * ✅ React에서 선택한 시간을 Django로 보낼 때 올바른 형식으로 변환
 * 사용자가 선택한 KST 시간을 naive datetime으로 변환 (Django가 KST로 해석하도록)
 */
export const formatDateTimeForDjango = (dateTimeInput) => {
  if (!dateTimeInput) return null;
  
  console.log('🕐 Django용 시간 변환 입력:', dateTimeInput, typeof dateTimeInput);
  
  try {
    let localTime;
    
    if (typeof dateTimeInput === 'string') {
      if (dateTimeInput.includes('T')) {
        // "2025-06-26T15:30" 형식의 문자열
        localTime = new Date(dateTimeInput);
      } else {
        localTime = new Date(dateTimeInput);
      }
    } else if (dateTimeInput instanceof Date) {
      localTime = dateTimeInput;
    } else {
      console.error('❌ 지원하지 않는 날짜 형식:', dateTimeInput);
      return null;
    }
    
    if (isNaN(localTime.getTime())) {
      console.error('❌ 잘못된 날짜:', dateTimeInput);
      return null;
    }
    
    // ✅ 중요: 사용자가 입력한 시간을 그대로 naive datetime으로 변환
    // Django settings.py에서 TIME_ZONE='Asia/Seoul'이므로 naive datetime은 KST로 해석됨
    const year = localTime.getFullYear();
    const month = String(localTime.getMonth() + 1).padStart(2, '0');
    const day = String(localTime.getDate()).padStart(2, '0');
    const hours = String(localTime.getHours()).padStart(2, '0');
    const minutes = String(localTime.getMinutes()).padStart(2, '0');
    const seconds = String(localTime.getSeconds()).padStart(2, '0');
    
    // naive datetime 형식 (시간대 정보 없음)
    const result = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    
    console.log('🕐 Django용 변환 결과:', result);
    return result;
    
  } catch (error) {
    console.error('❌ formatDateTimeForDjango 오류:', error);
    return null;
  }
};

/**
 * ✅ 표시용 시간 포맷 (KST 기준)
 */
export const formatTimeForDisplay = (dateTime, includeSeconds = false) => {
  if (!dateTime) return '';
  
  try {
    // Django에서 받은 시간이면 KST로 변환
    const kstTime = typeof dateTime === 'string' && 
                   (dateTime.includes('Z') || dateTime.includes('+') || dateTime.includes('T'))
                   ? convertDjangoTimeToKST(dateTime)
                   : (dateTime instanceof Date ? dateTime : new Date(dateTime));
    
    if (!kstTime || isNaN(kstTime.getTime())) {
      return '';
    }
    
    const hours = String(kstTime.getHours()).padStart(2, '0');
    const minutes = String(kstTime.getMinutes()).padStart(2, '0');
    
    if (includeSeconds) {
      const seconds = String(kstTime.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
    
    return `${hours}:${minutes}`;
    
  } catch (error) {
    console.error('❌ formatTimeForDisplay 오류:', error);
    return '';
  }
};

/**
 * ✅ 날짜 표시용 포맷 (KST 기준)
 */
export const formatDateForDisplay = (date) => {
  if (!date) return '';
  
  try {
    // Django에서 받은 시간이면 KST로 변환
    const kstTime = typeof date === 'string' && 
                   (date.includes('Z') || date.includes('+') || date.includes('T'))
                   ? convertDjangoTimeToKST(date)
                   : (date instanceof Date ? date : new Date(date));
    
    if (!kstTime || isNaN(kstTime.getTime())) {
      return '';
    }
    
    const year = kstTime.getFullYear();
    const month = String(kstTime.getMonth() + 1).padStart(2, '0');
    const day = String(kstTime.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
    
  } catch (error) {
    console.error('❌ formatDateForDisplay 오류:', error);
    return '';
  }
};

/**
 * ✅ datetime-local input용 형식 변환 (KST 기준)
 */
export const formatForDateTimeInput = (dateTime) => {
  if (!dateTime) return '';
  
  try {
    // Django에서 받은 시간이면 KST로 변환
    const kstTime = typeof dateTime === 'string' && 
                   (dateTime.includes('Z') || dateTime.includes('+') || dateTime.includes('T'))
                   ? convertDjangoTimeToKST(dateTime)
                   : (dateTime instanceof Date ? dateTime : new Date(dateTime));
    
    if (!kstTime || isNaN(kstTime.getTime())) {
      return '';
    }
    
    const year = kstTime.getFullYear();
    const month = String(kstTime.getMonth() + 1).padStart(2, '0');
    const day = String(kstTime.getDate()).padStart(2, '0');
    const hours = String(kstTime.getHours()).padStart(2, '0');
    const minutes = String(kstTime.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
    
  } catch (error) {
    console.error('❌ formatForDateTimeInput 오류:', error);
    return '';
  }
};

/**
 * 시간대 디버깅 함수
 */
export const debugTimezone = (time, label = '') => {
  if (!time) return;
  
  const original = time;
  const asDate = time instanceof Date ? time : new Date(time);
  const kstConverted = convertDjangoTimeToKST(time);
  
  console.log(`🕐 [TIMEZONE DEBUG] ${label}:`, {
    original: original,
    type: typeof original,
    asDate: asDate.toISOString(),
    browserLocal: asDate.toLocaleString(),
    kstConverted: kstConverted ? kstConverted.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : null,
    forInput: formatForDateTimeInput(time),
    forDjango: formatDateTimeForDjango(time)
  });
};

/**
 * ✅ 하위 호환성을 위한 기존 함수명 유지
 */
export const formatDateTimeForServer = formatDateTimeForDjango;

/**
 * DateTime에서 시간 부분만 추출 (HH:MM 형식)
 */
export const extractTimeFromDateTime = (dateTime) => {
  if (!dateTime) return '';
  
  try {
    // Django에서 받은 시간이면 KST로 변환 후 시간 추출
    const kstTime = typeof dateTime === 'string' && 
                   (dateTime.includes('Z') || dateTime.includes('+') || dateTime.includes('T'))
                   ? convertDjangoTimeToKST(dateTime)
                   : (dateTime instanceof Date ? dateTime : new Date(dateTime));
    
    if (!kstTime || isNaN(kstTime.getTime())) {
      return '';
    }
    
    const hours = String(kstTime.getHours()).padStart(2, '0');
    const minutes = String(kstTime.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('❌ extractTimeFromDateTime 오류:', error);
    return '';
  }
};

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷 (기존 함수명 유지)
 */
export const formatDate = formatDateForDisplay;

/**
 * 시간을 HH:MM 형식으로 포맷 (기존 함수명 유지)
 */
export const formatTime = (date) => {
  return formatTimeForDisplay(date);
};

/**
 * 종료 시간 계산
 */
export const getEndTime = (startTime, duration) => {
  try {
    const [h, m] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);

    // duration 제한
    const safeDuration = Math.min(duration || 30, 120); // 최대 3시간
    const end = new Date(start.getTime() + safeDuration * 60000);

    const eh = String(end.getHours()).padStart(2, '0');
    const em = String(end.getMinutes()).padStart(2, '0');

    return `${eh}:${em}`;
  } catch (err) {
    return '??:??';
  }
};


/**
 * 모달리티별 기본 소요시간 반환
 */
export const getDefaultDuration = (modality) => {
  const durations = {
    'CR': 10,  // X-ray
    'CT': 30,  // CT
    'MR': 60,  // MRI
    'US': 20,  // 초음파
    'NM': 45,  // Nuclear Medicine
    'PT': 90,  // PET
    'DX': 15,  // Digital Radiography
    'XA': 45,  // Angiography
    'MG': 20   // Mammography
  };
  
  return durations[modality] || 30
};

/**
 * 한국어 날짜 문자열을 YYYY-MM-DD 형식으로 변환
 */
export const parseKoreanDate = (koreanStr) => {
  if (!koreanStr) return null;
  
  const match = koreanStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
};

/**
 * 서버에서 받은 시간을 브라우저 표시용으로 변환 (기존 함수명 유지)
 */
export const formatServerTimeToLocal = (serverTime) => {
  return convertDjangoTimeToKST(serverTime);
};

// 개발환경에서 전역 노출
if (process.env.NODE_ENV === 'development') {
  window.timeUtils = {
    // 새로운 함수들
    getTodayKST,
    convertDjangoTimeToKST,
    formatDateTimeForDjango,
    formatTimeForDisplay,
    formatDateForDisplay,
    formatForDateTimeInput,
    debugTimezone,
    
    // 기존 함수명 유지 (하위 호환성)
    formatDateTimeForServer,
    extractTimeFromDateTime,
    formatDate,
    formatTime,
    formatServerTimeToLocal,
    parseKoreanDate,
    getEndTime,
    getDefaultDuration
  };
  console.log('🔧 timeUtils (완전한 시간대 수정 버전)이 window.timeUtils로 노출됨');
}