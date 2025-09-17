let allCompetitions = []; // 모든 대회 데이터를 저장할 배열

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/';
        return;
    }

    fetchAllCompetitions(token);

    // 년도 필터에 이벤트 리스너 추가
    document.getElementById('year-filter').addEventListener('change', (event) => {
        const selectedYear = event.target.value;
        if (selectedYear === 'all') {
            renderCompetitions(allCompetitions);
        } else {
            const filteredCompetitions = allCompetitions.filter(comp => 
                new Date(comp.start_date).getFullYear() == selectedYear
            );
            renderCompetitions(filteredCompetitions);
        }
    });
});

async function fetchAllCompetitions(token) {
    try {
        const response = await fetch('/competitions', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('대회 목록 로딩 실패');
        
        allCompetitions = await response.json();
        populateYearFilter(); // 년도 필터 채우기
        renderCompetitions(allCompetitions); // 전체 목록으로 첫 화면 렌더링
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

function populateYearFilter() {
    const yearFilter = document.getElementById('year-filter');
    // Set을 사용해 중복되지 않는 년도만 추출
    const years = [...new Set(allCompetitions.map(comp => new Date(comp.start_date).getFullYear()))];
    // 정렬
    years.sort((a, b) => b - a); 

    // 기존 옵션(전체) 외에 년도 옵션 추가
    yearFilter.innerHTML = '<option value="all">전체</option>'; 
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}년`;
        yearFilter.appendChild(option);
    });
}

function renderCompetitions(competitionsToDisplay) {
    const tableBody = document.getElementById('competitions-tbody');
    tableBody.innerHTML = '';

    competitionsToDisplay.forEach(comp => {
        const row = document.createElement('tr');
         row.innerHTML = `
            <td>${comp.id}</td>
            
            <td><a href="/static/admin_competition_detail.html?id=${comp.id}">${comp.name}</a></td>
            
            <td>${comp.start_date}</td>
            <td>${comp.end_date}</td>
            <td>${comp.location}</td>
        `;
        tableBody.appendChild(row);
    });
}