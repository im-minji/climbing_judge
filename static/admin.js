// =================================================================
// 전역 변수 (Global Variables)
// =================================================================
let allJudges = [];
let currentJudgePage = 1;
const judgesPerPage = 20;

let allCompetitions = [];

// =================================================================
// 페이지 초기화 (Initialization)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. 로그인 토큰 확인 (보안)
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/';
        return;
    }

    // 2. 초기 데이터 불러오기
    fetchAllJudges(token);
    fetchAllCompetitions(token);

    // 3. 폼 제출 이벤트 리스너 설정
    document.getElementById('register-form').addEventListener('submit', (event) => {
        event.preventDefault();
        registerNewJudge(token);
    });
    
    document.getElementById('competition-form').addEventListener('submit', (event) => {
        event.preventDefault();
        registerNewCompetition(token);
    });

    // 4. 심판 목록 페이지네이션 버튼 이벤트 설정
    document.getElementById('prev-page-btn').addEventListener('click', () => {
        if (currentJudgePage > 1) {
            currentJudgePage--;
            renderJudgesPage();
        }
    });

    document.getElementById('next-page-btn').addEventListener('click', () => {
        const totalPages = Math.ceil(allJudges.length / judgesPerPage);
        if (currentJudgePage < totalPages) {
            currentJudgePage++;
            renderJudgesPage();
        }
    });
});

// =================================================================
// 심판 관리 기능 (Judge Management Functions)
// =================================================================

async function fetchAllJudges(token) {
    try {
        const response = await fetch('/judges', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('심판 목록 로딩 실패');
        allJudges = await response.json();
        currentJudgePage = 1;
        renderJudgesPage();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

function renderJudgesPage() {
    const tableBody = document.getElementById('judges-tbody');
    tableBody.innerHTML = '';
    const startIndex = (currentJudgePage - 1) * judgesPerPage;
    const endIndex = startIndex + judgesPerPage;
    const judgesToShow = allJudges.slice(startIndex, endIndex);

    judgesToShow.forEach(judge => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${judge.judge_number}</td>
            <td>${judge.name}</td>
            <td>${judge.affiliation}</td>
            <td>${judge.national_license_grade}급</td>
            <td>${judge.total_assignments_count}</td>
            <td>${judge.email}</td>
            <td>${judge.role}</td>
            <td><a href="#" onclick='openEditModal(event, ${JSON.stringify(judge)})'>수정</a> / <a href="#" onclick="deleteJudge('${judge.id}', '${judge.name}')">삭제</a></td>
        `;
        tableBody.appendChild(row);
    });

    const totalPages = Math.ceil(allJudges.length / judgesPerPage) || 1;
    document.getElementById('page-info').textContent = `${currentJudgePage} / ${totalPages}`;
    document.getElementById('prev-page-btn').disabled = currentJudgePage === 1;
    document.getElementById('next-page-btn').disabled = currentJudgePage >= totalPages;
}

async function registerNewJudge(token) {
    const form = document.getElementById('register-form');
    const formData = new FormData(form);
    const judgeData = Object.fromEntries(formData.entries());
    judgeData.national_license_grade = parseInt(judgeData.national_license_grade, 10);

    try {
        const response = await fetch('/judges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(judgeData)
        });
        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.detail || '심판 등록 실패');
        }
        alert('신규 심판 등록 성공');
        form.reset();
        fetchAllJudges(token);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

async function deleteJudge(judgeId, judgeName) {
    if (confirm(`'${judgeName}' 심판을 정말로 삭제하시겠습니까?`)) {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`/judges/${judgeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('심판 삭제 실패');
            alert(`'${judgeName}' 심판 삭제 성공`);
            fetchAllJudges(token);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }
}

function openEditModal(event, judge) {
    event.preventDefault();
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-form');
    form.id.value = judge.id;
    form.judge_number.value = judge.judge_number;
    form.name.value = judge.name;
    form.affiliation.value = judge.affiliation;
    form.national_license_grade.value = judge.national_license_grade;
    form.email.value = judge.email;
    form.role.value = judge.role;
    modal.showModal();
}

function closeEditModal(event) {
    event.preventDefault();
    document.getElementById('edit-modal').close();
}

async function handleUpdateJudge(event) {
    event.preventDefault();
    const form = document.getElementById('edit-form');
    const judgeId = form.id.value;
    const token = localStorage.getItem('access_token');
    const updatedData = {
        judge_number: form.judge_number.value,
        name: form.name.value,
        affiliation: form.affiliation.value,
        national_license_grade: parseInt(form.national_license_grade.value, 10),
        email: form.email.value,
        role: form.role.value,
    };

    try {
        const response = await fetch(`/judges/${judgeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(updatedData)
        });
        if (!response.ok) throw new Error('정보 수정 실패');
        alert('심판 정보 수정 성공');
        document.getElementById('edit-modal').close();
        fetchAllJudges(token);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// =================================================================
// 대회 관리 기능 (Competition Management Functions)
// =================================================================

async function fetchAllCompetitions(token) {
    try {
        const response = await fetch('/competitions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('대회 목록 로딩 실패');
        allCompetitions = await response.json();
        renderAllCompetitions();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

function renderAllCompetitions() {
    const tableBody = document.getElementById('competitions-tbody');
    tableBody.innerHTML = '';
    allCompetitions.forEach(comp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${comp.id}</td>
            <td>${comp.name}</td>
            <td>${comp.start_date}</td>
            <td>${comp.end_date}</td>
            <td>${comp.location}</td>
            <td><a href="#">심판 배정</a></td>
        `;
        tableBody.appendChild(row);
    });
}

async function registerNewCompetition(token) {
    const form = document.getElementById('competition-form');
    const formData = new FormData(form);
    const competitionData = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/competitions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(competitionData)
        });
        if (!response.ok) throw new Error('대회 등록 실패');
        alert('신규 대회 등록 성공');
        form.reset();
        fetchAllCompetitions(token);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}