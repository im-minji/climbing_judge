let allJudges = []; // 심판 목록을 저장할 배열

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/';
        return;
    }

    // 페이지 로드 시, 심판 목록을 모두 불러와 체크리스트를 만듭니다.
    fetchAllJudgesForChecklist(token);

    // 심판 검색 기능
    document.getElementById('judge-search').addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredJudges = allJudges.filter(judge => 
            judge.name.toLowerCase().includes(searchTerm) || 
            judge.judge_number.toLowerCase().includes(searchTerm)
        );
        renderJudgeChecklist(filteredJudges);
    });
    
    // 폼 제출 이벤트
    document.getElementById('competition-form').addEventListener('submit', (event) => {
        event.preventDefault();
        handleFormSubmit(token);
    });
});

async function fetchAllJudgesForChecklist(token) {
    try {
        const response = await fetch('/judges', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('심판 목록 로딩 실패');
        allJudges = await response.json();
        renderJudgeChecklist(allJudges);
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

function renderJudgeChecklist(judges) {
    const checklistContainer = document.getElementById('judge-checklist');
    checklistContainer.innerHTML = '';
    judges.forEach(judge => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="assigned_judges" value="${judge.id}"> ${judge.name} (${judge.judge_number})`;
        checklistContainer.appendChild(label);
    });
}

async function handleFormSubmit(token) {
    const form = document.getElementById('competition-form');
    const formData = new FormData(form);
    const competitionData = {
        name: formData.get('name'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        location: formData.get('location'),
    };
    
    // 체크된 심판들의 ID 목록을 가져옵니다.
    const selectedJudgeIds = Array.from(formData.getAll('assigned_judges'));

    if (!confirm("대회를 생성하고 선택된 심판들을 배정하시겠습니까?")) return;

    try {
        // 1. 대회 생성 API 호출
        const compResponse = await fetch('/competitions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(competitionData)
        });
        if (!compResponse.ok) throw new Error('대회 생성 실패');
        
        const newCompetition = await compResponse.json();
        const newCompetitionId = newCompetition[0].id;

        // 2. 선택된 심판들을 하나씩 배정 API 호출
        const assignmentPromises = selectedJudgeIds.map(judgeId => {
            return fetch(`/competitions/${newCompetitionId}/judges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ judge_id: judgeId })
            });
        });

        // 모든 배정 요청이 끝날 때까지 기다립니다.
        await Promise.all(assignmentPromises);

        alert('대회 생성 및 심판 배정이 성공적으로 완료되었습니다.');
        window.location.href = '/static/admin_competitions.html'; // 목록 페이지로 이동

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}