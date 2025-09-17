let allJudges = [];
let currentPage = 1;
const judgesPerPage = 20;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = '/';
        return;
    }

    fetchAllJudges(token);

    document.getElementById('prev-page-btn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderJudgesPage();
        }
    });

    document.getElementById('next-page-btn').addEventListener('click', () => {
        const totalPages = Math.ceil(allJudges.length / judgesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderJudgesPage();
        }
    });
});

async function fetchAllJudges(token) {
    try {
        const response = await fetch('/judges', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('심판 목록 로딩 실패');
        allJudges = await response.json();
        currentPage = 1;
        renderJudgesPage();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

function renderJudgesPage() {
    const tableBody = document.getElementById('judges-tbody');
    tableBody.innerHTML = '';
    const startIndex = (currentPage - 1) * judgesPerPage;
    const endIndex = startIndex + judgesPerPage;
    const judgesToShow = allJudges.slice(startIndex, endIndex);

    judgesToShow.forEach(judge => {
        const row = document.createElement('tr');
        // 수정 기능은 별도의 페이지로 이동하도록 링크를 수정해야 합니다 (향후 구현)
        row.innerHTML = `
            <td>${judge.judge_number}</td>
            <td>${judge.name}</td>
            <td>${judge.affiliation}</td>
            <td>${judge.national_license_grade}급</td>
            <td>${judge.total_assignments_count}</td>
            <td>${judge.email}</td>
            <td>${judge.role}</td>
            <td><a href="#">수정</a> / <a href="#" onclick="deleteJudge('${judge.id}', '${judge.name}')">삭제</a></td>
        `;
        tableBody.appendChild(row);
    });

    const totalPages = Math.ceil(allJudges.length / judgesPerPage) || 1;
    document.getElementById('page-info').textContent = `${currentPage} / ${totalPages}`;
    document.getElementById('prev-page-btn').disabled = currentPage === 1;
    document.getElementById('next-page-btn').disabled = currentPage >= totalPages;
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