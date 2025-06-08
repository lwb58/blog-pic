// 为HTML表格添加排序功能
document.addEventListener('DOMContentLoaded', () => {
    const tables = document.querySelectorAll('.dataframe');
    tables.forEach(table => {
        const headers = table.querySelectorAll('th');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const columnIndex = header.cellIndex;
                const rows = Array.from(table.querySelectorAll('tr:not(:first-child)'));
                const isNumeric = !isNaN(parseFloat(rows[0].cells[columnIndex].textContent));

                rows.sort((a, b) => {
                    const valA = a.cells[columnIndex].textContent;
                    const valB = b.cells[columnIndex].textContent;
                    return isNumeric
                        ? parseFloat(valA) - parseFloat(valB)
                        : valA.localeCompare(valB);
                });

                // 重新插入排序后的行
                const tbody = table.querySelector('tbody');
                rows.forEach(row => tbody.appendChild(row));
            });
        });
    });
});