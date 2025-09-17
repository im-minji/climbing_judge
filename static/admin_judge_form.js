document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/';
        return;
    }

    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = new FormData(registerForm);
        const judgeData = Object.fromEntries(formData.entries());
        judgeData.national_license_grade = parseInt(judgeData.national_license_grade, 10);

        try {
            const response = await fetch('/judges', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(judgeData)
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.detail || '심판 등록에 실패했습니다.');
            }

            alert('새로운 심판이 성공적으로 등록되었습니다. 목록 페이지로 돌아갑니다.');
            window.location.href = '/static/admin_judges.html'; // 목록 페이지로 자동 이동

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });
});