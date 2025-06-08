document.addEventListener('DOMContentLoaded', function() {
            // 排序功能
            const sortableHeaders = document.querySelectorAll('.sortable');
            let currentSort = { column: null, direction: 'asc' };

            sortableHeaders.forEach(header => {
                header.addEventListener('click', function() {
                    const column = this.dataset.sort;
                    let direction = 'asc';

                    if (currentSort.column === column) {
                        direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                    }

                    // 更新排序指示器
                    sortableHeaders.forEach(h => {
                        h.classList.remove('sort-asc', 'sort-desc');
                    });
                    this.classList.add(`sort-${direction}`);

                    currentSort = { column: column, direction: direction };
                    sortTable(column, direction);
                    updateResultCount();
                });
            });

            // 筛选功能
            const filters = {
                market_cap: '',
                roe: '',
                pe: '',
                change: ''
            };

            // 下拉筛选
            document.getElementById('marketCapFilter').addEventListener('change', function() {
                filters.market_cap = this.value;
                applyFilters();
            });

            document.getElementById('roeFilter').addEventListener('change', function() {
                filters.roe = this.value;
                applyFilters();
            });

            document.getElementById('peFilter').addEventListener('change', function() {
                filters.pe = this.value;
                applyFilters();
            });

            document.getElementById('changeFilter').addEventListener('change', function() {
                filters.change = this.value;
                applyFilters();
            });

            // 快速筛选标签
            document.querySelectorAll('.badge-filter').forEach(badge => {
                badge.addEventListener('click', function() {
                    const [filter, value] = this.dataset.filter.split('|');
                    filters[filter] = value;

                    // 更新下拉菜单
                    const selectId = `${filter}Filter`;
                    const select = document.getElementById(selectId);
                    if (select) select.value = value;

                    applyFilters();
                });
            });

            // 重置筛选
            document.getElementById('resetFilters').addEventListener('click', function() {
                Object.keys(filters).forEach(key => {
                    filters[key] = '';
                    const select = document.getElementById(`${key}Filter`);
                    if (select) select.value = '';
                });

                applyFilters();
            });

            // 应用筛选
            function applyFilters() {
                const rows = document.querySelectorAll('#stockTable tbody tr');
                let visibleCount = 0;

                rows.forEach(row => {
                    let showRow = true;

                    // 市值筛选
                    if (filters.market_cap) {
                        const marketCap = parseFloat(row.dataset.market_cap);
                        const [min, max] = filters.market_cap.split('-').map(Number);

                        if (filters.market_cap.endsWith('-')) {
                            showRow = showRow && marketCap >= min;
                        } else if (filters.market_cap.startsWith('-')) {
                            showRow = showRow && marketCap <= max;
                        } else if (filters.market_cap.includes('-')) {
                            showRow = showRow && marketCap >= min && marketCap <= max;
                        } else if (filters.market_cap === 'up') {
                            showRow = showRow && marketCap > 0;
                        } else if (filters.market_cap === 'down') {
                            showRow = showRow && marketCap < 0;
                        }
                    }

                    // ROE筛选
                    if (filters.roe) {
                        const roe = parseFloat(row.dataset.roe);
                        const [min, max] = filters.roe.split('-').map(Number);

                        if (filters.roe.endsWith('-')) {
                            showRow = showRow && roe >= min;
                        } else if (filters.roe.startsWith('-')) {
                            showRow = showRow && roe <= max;
                        } else if (filters.roe.includes('-')) {
                            showRow = showRow && roe >= min && roe <= max;
                        } else if (filters.roe === 'up') {
                            showRow = showRow && roe > 0;
                        } else if (filters.roe === 'down') {
                            showRow = showRow && roe < 0;
                        }
                    }

                    // 市盈率筛选
                    if (filters.pe) {
                        const pe = parseFloat(row.dataset.pe) || 0;
                        const [min, max] = filters.pe.split('-').map(Number);

                        if (filters.pe.endsWith('-')) {
                            showRow = showRow && pe >= min;
                        } else if (filters.pe.startsWith('-')) {
                            showRow = showRow && pe <= max;
                        } else if (filters.pe.includes('-')) {
                            showRow = showRow && pe >= min && pe <= max;
                        } else if (filters.pe === 'up') {
                            showRow = showRow && pe > 0;
                        } else if (filters.pe === 'down') {
                            showRow = showRow && pe < 0;
                        }
                    }

                    // 涨跌幅筛选
                    if (filters.change) {
                        const change = parseFloat(row.dataset.change);
                        const [min, max] = filters.change.split('-').map(Number);

                        if (filters.change.endsWith('-')) {
                            showRow = showRow && change >= min;
                        } else if (filters.change.startsWith('-')) {
                            showRow = showRow && change <= max;
                        } else if (filters.change.includes('-')) {
                            showRow = showRow && change >= min && change <= max;
                        } else if (filters.change === 'up') {
                            showRow = showRow && change > 0;
                        } else if (filters.change === 'down') {
                            showRow = showRow && change < 0;
                        }
                    }

                    row.style.display = showRow ? '' : 'none';
                    if (showRow) visibleCount++;
                });

                document.getElementById('resultCount').textContent = `共 ${visibleCount} 条数据`;
                updatePagination();
            }

            // 表格排序
            function sortTable(column, direction) {
                const tbody = document.querySelector('#stockTable tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));

                rows.sort((a, b) => {
                    let aValue = a.dataset[column];
                    let bValue = b.dataset[column];

                    // 处理可能为空的值
                    if (aValue === undefined || bValue === undefined) return 0;

                    // 数值比较
                    if (column !== 'code' && column !== 'name') {
                        aValue = parseFloat(aValue) || 0;
                        bValue = parseFloat(bValue) || 0;
                        return direction === 'asc' ? aValue - bValue : bValue - aValue;
                    }

                    // 字符串比较
                    return direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                });

                // 重新插入排序后的行
                rows.forEach(row => tbody.appendChild(row));
            }

            // 更新结果计数
            function updateResultCount() {
                const visibleRows = document.querySelectorAll('#stockTable tbody tr:not([style*="display: none"])');
                document.getElementById('resultCount').textContent = `共 ${visibleRows.length} 条数据`;
            }

            // 初始化分页
            function updatePagination() {
                // 简化的分页逻辑，实际项目中可能需要更复杂的分页处理
                const pagination = document.getElementById('pagination');
                pagination.innerHTML = '';

                // 这里可以添加实际的分页逻辑
                // 例如: <li class="page-item active"><a class="page-link" href="#">1</a></li>
            }

            // 初始加载时更新计数
            updateResultCount();
        });