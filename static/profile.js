let allMyCompetitions = []; // 나의 모든 대회 데이터를 저장할 배열

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/';
        return;
    }

    // 1. 내 프로필 정보 가져오기
    fetchMyProfile(token);
    // 2. 내 대회 목록 가져오기
    fetchMyCompetitions(token);

    // 3. 년도 필터 이벤트 리스너
    document.getElementById('year-filter').addEventListener('change', (event) => {
        const selectedYear = event.target.value;
        const filtered = (selectedYear === 'all') 
            ? allMyCompetitions 
            : allMyCompetitions.filter(c => new Date(c.start_date).getFullYear() == selectedYear);
        renderMyCompetitions(filtered);
    });

    // 4. 로그아웃 버튼
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('access_token');
        alert('로그아웃 되었습니다.');
        window.location.href = '/';
    });
});

async function fetchMyProfile(token) {
    try {
        const response = await fetch('/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('프로필 로딩 실패');
        
        const profile = await response.json();
        document.getElementById('profile-name').textContent = `${profile.name} 심판님`;
        document.getElementById('profile-info').innerHTML = `
            <p><strong>심판 번호:</strong> ${profile.judge_number}</p>
            <p><strong>소속:</strong> ${profile.affiliation}</p>
            <p><strong>등급:</strong> ${profile.national_license_grade}급</p>
        `;
    } catch (error) { console.error(error); }
}

async function fetchMyCompetitions(token) {
    try {
        const response = await fetch('/users/me/competitions', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('대회 목록 로딩 실패');
        
        allMyCompetitions = await response.json();
        populateYearFilter();
        renderMyCompetitions(allMyCompetitions);
    } catch (error) { console.error(error); }
}

function populateYearFilter() {
    const yearFilter = document.getElementById('year-filter');
    const years = [...new Set(allMyCompetitions.map(c => new Date(c.start_date).getFullYear()))];
    years.sort((a, b) => b - a);
    
    yearFilter.innerHTML = '<option value="all">전체</option>';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}년`;
        yearFilter.appendChild(option);
    });
}

function renderMyCompetitions(competitions) {
    const tableBody = document.getElementById('competitions-tbody');
    tableBody.innerHTML = '';
    competitions.forEach(comp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${comp.name}</td>
            <td>${comp.start_date}</td>
            <td>${comp.end_date}</td>
            <td>${comp.location}</td>
        `;
        tableBody.appendChild(row);
    });
}