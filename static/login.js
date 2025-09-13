// static/login.js
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessage.textContent = ''; // 이전 에러 메시지 초기화

    const judgeNumber = document.getElementById('judge_number').value;
    const password = document.getElementById('password').value;

    try {
        // 1. 로그인 요청
        const loginResponse = await fetch('/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ judge_number: judgeNumber, password: password }),
        });

        if (!loginResponse.ok) {
            throw new Error('심판 번호 또는 비밀번호가 올바르지 않습니다.');
        }

        const session = await loginResponse.json();
        const accessToken = session.access_token;

        // 2. 받은 토큰을 브라우저 저장소에 저장
        localStorage.setItem('access_token', accessToken);

        // 3. 저장한 토큰으로 '내 정보 조회' API 호출하여 역할(role) 확인
        const profileResponse = await fetch('/users/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!profileResponse.ok) {
            throw new Error('프로필 정보를 가져오는 데 실패했습니다.');
        }

        const profile = await profileResponse.json();

        // 4. 역할(role)에 따라 다른 페이지로 이동
        if (profile.role === 'admin') {
            window.location.href = '/static/admin.html'; // 관리자 페이지로 이동
        } else {
            window.location.href = '/static/profile.html'; // 일반 심판 페이지로 이동
        }

    } catch (error) {
        errorMessage.textContent = error.message;
    }
});