// static/admin_competition_detail.js

let allJudges = [];
let originalAssignedJudgeIds = [];
let competitionId = null;
let currentCompetitionData = null; // 현재 대회 정보를 저장할 변수

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    competitionId = urlParams.get('id');

    if (!competitionId) {
        alert('대회 ID가 올바르지 않습니다.');
        window.location.href = '/static/admin_competitions.html';
        return;
    }

    // 1. 초기 데이터 로드 및 조회 모드 렌더링
    await fetchCompetitionDetails(token, competitionId);

    // 2. 버튼 이벤트 리스너 설정
    document.getElementById('edit-btn').addEventListener('click', () => toggleEditMode(true));
    document.getElementById('cancel-edit-btn').addEventListener('click', () => toggleEditMode(false));
    document.getElementById('competition-details-form').addEventListener('submit', (event) => {
        event.preventDefault();
        handleFormSubmit(token);
    });
    document.getElementById('delete-competition-btn').addEventListener('click', () => {
        deleteCurrentCompetition(token);
    });
});

async function fetchCompetitionDetails(token, compId) {
    try {
        const response = await fetch(`/competitions/${compId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('대회 정보를 불러오는데 실패했습니다.');
        
        currentCompetitionData = await response.json();
        originalAssignedJudgeIds = currentCompetitionData.competition_assignments.map(a => a.judges.id);

        renderViewMode(currentCompetitionData); // 초기 화면은 조회 모드
        
    } catch (error) { console.error(error); alert(error.message); }
}

// 조회 모드를 그리는 함수
function renderViewMode(competition) {
    document.getElementById('competition-title').innerHTML = `<h1>${competition.name}</h1><p>대회 ID: ${competition.id}</p>`;
    
    // 대회 정보 텍스트로 표시
    document.getElementById('competition-display').innerHTML = `
        <p><strong>시작일:</strong> ${competition.start_date}</p>
        <p><strong>종료일:</strong> ${competition.end_date}</p>
        <p><strong>장소:</strong> ${competition.location}</p>
    `;

    // 배정된 심판 목록 테이블 채우기
    const assignedJudgesTbody = document.getElementById('assigned-judges-tbody');
    assignedJudgesTbody.innerHTML = '';
    competition.competition_assignments.forEach(assignment => {
        const judge = assignment.judges;
        const row = document.createElement('tr');
        row.innerHTML = `<td>${judge.judge_number}</td><td>${judge.name}</td><td>${judge.national_license_grade}급</td>`;
        assignedJudgesTbody.appendChild(row);
    });
}

// 수정 모드를 그리는 함수 (수정 버튼 클릭 시 호출)
async function renderEditMode(competition) {
    // 폼 정보 채우기
    document.getElementById('competition-edit-fields').innerHTML = `
        <input type="text" name="name" value="${competition.name}" required>
        <div class="grid">
            <label>시작일<input type="date" name="start_date" value="${competition.start_date}" required></label>
            <label>종료일<input type="date" name="end_date" value="${competition.end_date}" required></label>
        </div>
        <input type="text" name="location" value="${competition.location}" required>`;
    
    // 전체 심판 목록을 불러와 체크리스트 생성
    const token = localStorage.getItem('access_token');
    await fetchAllJudgesForChecklist(token);
    document.getElementById('judge-search').addEventListener('input', handleSearch);
}

// 조회/수정 모드를 전환하는 함수
function toggleEditMode(isEdit) {
    const viewMode = document.getElementById('view-mode');
    const editMode = document.getElementById('edit-mode');

    if (isEdit) {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        renderEditMode(currentCompetitionData); // 수정 모드 내용 채우기
    } else {
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
    }
}

// (이하 함수들은 이전 답변과 거의 동일하며, 일부 수정됨)

async function fetchAllJudgesForChecklist(token) {
    if (allJudges.length > 0) { // 이미 불러왔으면 다시 부르지 않음
        renderJudgeChecklist(allJudges);
        return;
    }
    try {
        const response = await fetch('/judges', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('심판 목록 로딩 실패');
        allJudges = await response.json();
        renderJudgeChecklist(allJudges);
    } catch (error) { console.error(error); alert(error.message); }
}

function renderJudgeChecklist(judgesToDisplay) {
    const checklistContainer = document.getElementById('judge-checklist');
    checklistContainer.innerHTML = '';
    judgesToDisplay.forEach(judge => {
        const isChecked = originalAssignedJudgeIds.includes(judge.id);
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="assigned_judges" value="${judge.id}" ${isChecked ? 'checked' : ''}> ${judge.name} (${judge.judge_number})`;
        checklistContainer.appendChild(label);
    });
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredJudges = allJudges.filter(judge => 
        judge.name.toLowerCase().includes(searchTerm) || 
        judge.judge_number.toLowerCase().includes(searchTerm)
    );
    renderJudgeChecklist(filteredJudges);
}

async function handleFormSubmit(token) {
    if (!confirm("변경사항을 저장하시겠습니까?")) return;

    const form = document.getElementById('competition-details-form');
    const formData = new FormData(form);

    const competitionData = {
        name: formData.get('name'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        location: formData.get('location'),
    };
    
    const newlySelectedJudgeIds = Array.from(formData.getAll('assigned_judges'));
    const judgesToAdd = newlySelectedJudgeIds.filter(id => !originalAssignedJudgeIds.includes(id));
    const judgesToRemove = originalAssignedJudgeIds.filter(id => !newlySelectedJudgeIds.includes(id));

    try {
        // Promise들을 담을 배열
        const promises = [];

        // 1. 대회 정보 수정 API 호출
        promises.push(fetch(`/competitions/${competitionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(competitionData)
        }));

        // 2. 심판 추가/삭제 API 호출
        judgesToAdd.forEach(judgeId => {
            promises.push(fetch(`/competitions/${competitionId}/judges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ judge_id: judgeId })
            }));
        });
        judgesToRemove.forEach(judgeId => {
            promises.push(fetch(`/competitions/${competitionId}/judges/${judgeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }));
        });

        await Promise.all(promises);

        alert('성공적으로 수정되었습니다.');
        toggleEditMode(false); // 조회 모드로 전환
        fetchCompetitionDetails(token, competitionId); // 최신 데이터 다시 불러오기
    } catch (error) {
        console.error(error);
        alert('수정 중 오류가 발생했습니다.');
    }
}

async function deleteCurrentCompetition(token) {
    if (confirm("정말로 이 대회를 삭제하시겠습니까? 모든 배정 기록이 함께 삭제됩니다.")) {
        try {
            const response = await fetch(`/competitions/${competitionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('대회 삭제 실패');
            alert('대회가 성공적으로 삭제되었습니다. 목록 페이지로 돌아갑니다.');
            window.location.href = '/static/admin_competitions.html';
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }
}