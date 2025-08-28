// auth.js
import axios from 'axios';
const axiosInstance = axios.create({
  withCredentials: true,  // ✅ 이거 추가
});
export async function login({ username, password, code }) {
    try {
        const response = await axios.post('/api/account/login/', {
            username,
            password,
            code
        }, {
            withCredentials: true
        });
        console.log("✅ 로그인 성공", response.data);
        return response;
    } catch (error) {
        console.error("❌ 로그인 실패:", error.response?.data || error.message);
        throw error;
    }
}


export async function autoLogin({ code }) {
    return axios.post('/api/account/auto-login/', {
        code
    }, {
        withCredentials: true  // ✅ 자동 로그인도 쿠키 필요
    });
}
