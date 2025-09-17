// static/admin_competition_detail.js

let allJudges = []; // 전체 심판 목록
let originalAssignedJudgeIds = []; // 원래 배정되어 있던 심판 ID 목록
let competitionId = null; // 현재 보고있는 대회 ID

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

    // 1. 대회 상세 정보와 전체 심판 목록을 모두 불러옴
    await fetchCompetitionDetails(token, competitionId);
    await fetchAllJudgesForChecklist(token);

    // 2. 검색 및 폼 제출 이벤트 리스너 설정
    document.getElementById('judge-search').addEventListener('input', handleSearch);
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
        const competition = await response.json();
        
        // 제목, 폼 정보 채우기
        document.getElementById('competition-title').innerHTML = `<h1>${competition.name}</h1><p>대회 ID: ${competition.id}</p>`;
        document.getElementById('competition-edit-fields').innerHTML = `
            <input type="text" name="name" value="${competition.name}" required>
            <div class="grid">
                <label>시작일<input type="date" name="start_date" value="${competition.start_date}" required></label>
                <label>종료일<input type="date" name="end_date" value="${competition.end_date}" required></label>
            </div>
            <input type="text" name="location" value="${competition.location}" required>`;
        
        // 원래 배정된 심판 ID 목록 저장 (나중에 비교용)
        originalAssignedJudgeIds = competition.competition_assignments.map(a => a.judges.id);

    } catch (error) { console.error(error); alert(error.message); }
}

async function fetchAllJudgesForChecklist(token) {
    try {
        const response = await fetch('/judges', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('심판 목록 로딩 실패');
        allJudges = await response.json();
        renderJudgeChecklist(allJudges); // 체크리스트 렌더링
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

    // 1. 대회 정보 수정 (PATCH)
    const competitionData = {
        name: formData.get('name'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        location: formData.get('location'),
    };
    await fetch(`/competitions/${competitionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(competitionData)
    });

    // 2. 심판 배정 동기화
    const newlySelectedJudgeIds = Array.from(formData.getAll('assigned_judges'));
    const judgesToAdd = newlySelectedJudgeIds.filter(id => !originalAssignedJudgeIds.includes(id));
    const judgesToRemove = originalAssignedJudgeIds.filter(id => !newlySelectedJudgeIds.includes(id));

    const addPromises = judgesToAdd.map(judgeId => fetch(`/competitions/${competitionId}/judges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ judge_id: judgeId })
    }));
    
    const removePromises = judgesToRemove.map(judgeId => fetch(`/competitions/${competitionId}/judges/${judgeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    }));

    try {
        await Promise.all([...addPromises, ...removePromises]);
        alert('성공적으로 수정되었습니다.');
        window.location.reload(); // 페이지 새로고침하여 변경사항 확인
    } catch (error) {
        console.error(error);
        alert('심판 배정 수정 중 오류가 발생했습니다.');
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