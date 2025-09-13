// static/login.js

const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessage.textContent = '';

    const judgeNumber = document.getElementById('judge_number').value;
    const password = document.getElementById('password').value;

    try {
        // --- 1단계: 로그인 API 호출 ---
        console.log('1. 로그인 시도 중...', { judge_number: judgeNumber });
        const loginResponse = await fetch('/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ judge_number: judgeNumber, password: password }),
        });

        if (!loginResponse.ok) {
            // 로그인 실패 시, 서버가 보낸 에러 메시지를 확인
            const errorData = await loginResponse.json();
            console.error('로그인 API 에러:', errorData);
            throw new Error('심판 번호 또는 비밀번호가 올바르지 않습니다.');
        }

        const session = await loginResponse.json();
        const accessToken = session.access_token;
        console.log('2. 토큰 발급 성공!');

        // --- 2단계: 토큰을 브라우저에 저장 ---
        localStorage.setItem('access_token', accessToken);
        console.log('3. 토큰을 브라우저에 저장했습니다.');

        // --- 3단계: '내 정보 조회' API 호출 ---
        console.log('4. 저장된 토큰으로 내 프로필 정보 요청 중...');
        const profileResponse = await fetch('/users/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            console.error('프로필 API 에러:', errorData);
            throw new Error('프로필 정보를 가져오는 데 실패했습니다.');
        }

        const profile = await profileResponse.json();
        console.log('5. 프로필 정보 수신 성공!', profile);

        // --- 4단계: 역할에 따라 페이지 이동 ---
        console.log(`6. 역할(${profile.role})에 따라 페이지 이동 준비...`);
        if (profile.role === 'admin') {
            window.location.href = '/static/admin.html';
        } else {
            window.location.href = '/static/profile.html';
        }

    } catch (error) {
        console.error('최종 에러:', error); // 콘솔에 실제 에러 객체를 출력
        errorMessage.textContent = error.message;
    }
});