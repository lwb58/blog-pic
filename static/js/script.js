// 实时检查数据更新（每5分钟）
setInterval(() => {
    fetch('/data/latest.json')
        .then(res => res.json())
        .then(data => {
            const lastUpdate = document.querySelector('.timestamp').textContent;
            if (new Date(data.update_time) > new Date(lastUpdate.split('：')[1])) {
                if(confirm('检测到新数据，是否刷新页面？')) {
                    location.reload();
                }
            }
        });
}, 300000); // 5分钟