// static/admin.js

// 전역 변수: 모든 심판 데이터, 현재 페이지, 페이지 당 항목 수
let allJudges = [];
let currentPage = 1;
const judgesPerPage = 20;

// 페이지 로드가 완료되면 실행되는 메인 로직
document.addEventListener('DOMContentLoaded', () => {
    // 1. 로그인 토큰 확인
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/'; // 토큰 없으면 로그인 페이지로 강제 이동
        return;
    }

    // 2. 서버에서 모든 심판 데이터를 한번만 가져옴
    fetchAllJudges(token);

    // 3. 심판 등록 폼 제출 이벤트 설정
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        registerNewJudge(token);
    });

    // 4. 페이지네이션 버튼 이벤트 설정
    document.getElementById('prev-page-btn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderJudgesPage(); // 서버 요청 없이 화면만 다시 렌더링
        }
    });

    document.getElementById('next-page-btn').addEventListener('click', () => {
        const totalPages = Math.ceil(allJudges.length / judgesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderJudgesPage(); // 서버 요청 없이 화면만 다시 렌더링
        }
    });
});

/**
 * 서버에서 모든 심판 목록을 가져와 전역 변수(allJudges)에 저장하고 첫 페이지를 렌더링하는 함수
 * @param {string} token - 인증 토큰
 */
async function fetchAllJudges(token) {
    try {
        const response = await fetch('/judges', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('심판 목록을 불러오는데 실패했습니다.');
        
        allJudges = await response.json(); // 모든 심판 데이터를 전역 변수에 저장
        currentPage = 1; // 페이지를 1로 초기화
        renderJudgesPage(); // 첫 페이지를 화면에 표시
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

/**
 * allJudges 배열에서 현재 페이지에 맞는 데이터를 잘라 화면 테이블을 그리는 함수
 */
function renderJudgesPage() {
    const tableBody = document.getElementById('judges-tbody');
    tableBody.innerHTML = ''; // 테이블 내용 비우기

    // 현재 페이지에 해당하는 데이터만 잘라내기
    const startIndex = (currentPage - 1) * judgesPerPage;
    const endIndex = startIndex + judgesPerPage;
    const judgesToShow = allJudges.slice(startIndex, endIndex);

    // 잘라낸 데이터로 테이블 행 생성
    judgesToShow.forEach(judge => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${judge.judge_number}</td>
            <td>${judge.name}</td>
            <td>${judge.affiliation}</td>
            <td>${judge.email}</td>
            <td>${judge.role}</td>
            <td><a href="#">수정</a> / <a href="#" onclick="deleteJudge('${judge.id}', '${judge.name}')">삭제</a></td>
        `;
        tableBody.appendChild(row);
    });

    // 페이지 정보 및 버튼 상태 업데이트
    const totalPages = Math.ceil(allJudges.length / judgesPerPage) || 1;
    document.getElementById('page-info').textContent = `${currentPage} / ${totalPages}`;
    document.getElementById('prev-page-btn').disabled = currentPage === 1;
    document.getElementById('next-page-btn').disabled = currentPage >= totalPages;
}

/**
 * 폼 데이터를 가져와 신규 심판을 등록하고 목록을 새로고침하는 함수
 * @param {string} token - 인증 토큰
 */
async function registerNewJudge(token) {
    const form = document.getElementById('register-form');
    const formData = new FormData(form);
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

        alert('새로운 심판이 성공적으로 등록되었습니다.');
        form.reset(); 
        fetchAllJudges(token); // 전체 목록을 다시 불러와서 갱신

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

/**
 * (참고) 심판 삭제 기능 예시 함수
 * @param {string} judgeId - 삭제할 심판의 UUID
 * @param {string} judgeName - 삭제할 심판의 이름
 */
async function deleteJudge(judgeId, judgeName) {
    if (confirm(`정말로 '${judgeName}' 심판(ID: ${judgeId})을 삭제하시겠습니까?`)) {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`/judges/${judgeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.detail || '심판 삭제에 실패했습니다.');
            }

            alert(`'${judgeName}' 심판이 성공적으로 삭제되었습니다.`);
            fetchAllJudges(token); // 목록 새로고침

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }
}