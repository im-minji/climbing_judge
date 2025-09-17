document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/';
        return;
    }

    // URL에서 대회 ID를 가져옵니다. (예: ?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const competitionId = urlParams.get('id');

    if (!competitionId) {
        alert('대회 ID가 올바르지 않습니다.');
        window.location.href = '/static/admin_competitions.html';
        return;
    }

    fetchCompetitionDetails(token, competitionId);
});

async function fetchCompetitionDetails(token, competitionId) {
    try {
        const response = await fetch(`/competitions/${competitionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('대회 정보를 불러오는데 실패했습니다.');
        
        const competition = await response.json();
        
        // 1. 대회 제목 채우기
        const titleContainer = document.getElementById('competition-title');
        titleContainer.innerHTML = `
            <h1>${competition.name}</h1>
            <p>대회 ID: ${competition.id}</p>
        `;

        // 2. 대회 정보 수정 폼 채우기
        const formContainer = document.getElementById('competition-edit-form');
        formContainer.innerHTML = `
            <input type="text" name="name" value="${competition.name}" required>
            <div class="grid">
                <label>시작일<input type="date" name="start_date" value="${competition.start_date}" required></label>
                <label>종료일<input type="date" name="end_date" value="${competition.end_date}" required></label>
            </div>
            <input type="text" name="location" value="${competition.location}" required>
        `;
        
        // 3. 배정된 심판 목록 테이블 채우기
        const assignedJudgesTbody = document.querySelector('#assigned-judges-table tbody');
        assignedJudgesTbody.innerHTML = '';
        
        competition.competition_assignments.forEach(assignment => {
            const judge = assignment.judges; // JOIN으로 가져온 심판 정보
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${judge.judge_number}</td>
                <td>${judge.name}</td>
                <td>${judge.national_license_grade}급</td>
            `;
            assignedJudgesTbody.appendChild(row);
        });

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}