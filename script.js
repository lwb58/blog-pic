// 模拟100行数据
function generateData() {
    const data = [];
    for (let i = 0; i < 100; i++) {
        data.push({
            id: i + 1,
            date: `2023-${String(Math.floor(i/30) + 1).padStart(2, '0')}-${String(i%30 + 1).padStart(2, '0')}`,
            sales: (Math.random() * 10000).toFixed(2),
            region: ["华东", "华北", "华南"][i % 3]
        });
    }
    return data;
}

// 渲染表格
function renderTable(data) {
    const table = document.getElementById("data-table");
    const headers = Object.keys(data[0]);

    // 添加表头
    let html = "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";

    // 添加数据行
    data.forEach(row => {
        html += "<tr>" + headers.map(h => `<td>${row[h]}</td>`).join("") + "</tr>";
    });

    table.innerHTML = html;
}

// 页面加载时执行
window.onload = () => renderTable(generateData());