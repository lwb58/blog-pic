<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>股票数据分析</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <style>
        :root {
            --primary-color: #3498db;
            --hover-color: #2980b9;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            padding-top: 20px;
        }

        .card {
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            border: none;
        }

        .card-header {
            background-color: var(--primary-color);
            color: white;
            border-radius: 10px 10px 0 0 !important;
            padding: 15px 20px;
        }

        .table-responsive {
            overflow-x: auto;
        }

        .table {
            margin-bottom: 0;
        }

        .table th {
            white-space: nowrap;
            position: relative;
            background-color: #f1f5f9;
        }

        .table th.sortable:hover {
            background-color: #e2e8f0;
            cursor: pointer;
        }

        .table th.sort-asc::after {
            content: " ↑";
            font-size: 12px;
        }

        .table th.sort-desc::after {
            content: " ↓";
            font-size: 12px;
        }

        .table td {
            vertical-align: middle;
        }

        .positive {
            color: #e74c3c;
            font-weight: bold;
        }

        .negative {
            color: #2ecc71;
            font-weight: bold;
        }

        .filter-container {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .filter-group {
            margin-bottom: 10px;
        }

        .badge-filter {
            cursor: pointer;
            margin-right: 5px;
            margin-bottom: 5px;
        }

        @media (max-width: 768px) {
            .table td, .table th {
                padding: 8px 5px;
                font-size: 14px;
            }

            .card-header h5 {
                font-size: 18px;
            }
        }

        /* 移动端优化 */
        .mobile-hidden {
            display: table-cell;
        }

        @media (max-width: 576px) {
            .mobile-hidden {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">股票数据分析</h5>
                <div>
                    <button class="btn btn-sm btn-light" id="resetFilters">
                        <i class="bi bi-arrow-counterclockwise"></i> 重置筛选
                    </button>
                </div>
            </div>
            <div class="card-body">
                <!-- 筛选区域 -->
                <div class="filter-container">
                    <div class="row">
                        <div class="col-md-3 col-6 filter-group">
                            <label class="form-label">市值范围</label>
                            <select class="form-select form-select-sm" id="marketCapFilter">
                                <option value="">全部</option>
                                <option value="0-50">小于50亿</option>
                                <option value="50-100">50-100亿</option>
                                <option value="100-500">100-500亿</option>
                                <option value="500-1000">500-1000亿</option>
                                <option value="1000-">大于1000亿</option>
                            </select>
                        </div>
                        <div class="col-md-3 col-6 filter-group">
                            <label class="form-label">ROE范围</label>
                            <select class="form-select form-select-sm" id="roeFilter">
                                <option value="">全部</option>
                                <option value="0-5">0-5%</option>
                                <option value="5-10">5-10%</option>
                                <option value="10-15">10-15%</option>
                                <option value="15-20">15-20%</option>
                                <option value="20-">大于20%</option>
                            </select>
                        </div>
                        <div class="col-md-3 col-6 filter-group">
                            <label class="form-label">市盈率</label>
                            <select class="form-select form-select-sm" id="peFilter">
                                <option value="">全部</option>
                                <option value="0-10">0-10</option>
                                <option value="10-20">10-20</option>
                                <option value="20-30">20-30</option>
                                <option value="30-50">30-50</option>
                                <option value="50-">大于50</option>
                            </select>
                        </div>
                        <div class="col-md-3 col-6 filter-group">
                            <label class="form-label">涨跌幅</label>
                            <select class="form-select form-select-sm" id="changeFilter">
                                <option value="">全部</option>
                                <option value="up">上涨</option>
                                <option value="down">下跌</option>
                                <option value="0-5">0-5%</option>
                                <option value="5-10">5-10%</option>
                                <option value="10-">大于10%</option>
                            </select>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-12">
                            <label class="form-label">快速筛选</label>
                            <div>
                                <span class="badge rounded-pill bg-primary badge-filter" data-filter="pe|0-20">低市盈率</span>
                                <span class="badge rounded-pill bg-success badge-filter" data-filter="roe|10-">高ROE</span>
                                <span class="badge rounded-pill bg-danger badge-filter" data-filter="change|up">上涨股</span>
                                <span class="badge rounded-pill bg-warning text-dark badge-filter" data-filter="market_cap|500-">大盘股</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 数据表格 -->
                <div class="table-responsive">
                    <table class="table table-hover" id="stockTable">
                        <thead>
                            <tr>
                                <th class="sortable" data-sort="code">股票代码</th>
                                <th class="sortable" data-sort="name">股票名称</th>
                                <th class="sortable mobile-hidden" data-sort="market_cap">市值(亿)</th>
                                <th class="sortable" data-sort="roe">ROE(%)</th>
                                <th class="sortable mobile-hidden" data-sort="net_profit">扣非净利润(亿)</th>
                                <th class="sortable mobile-hidden" data-sort="gross_margin">毛利率(%)</th>
                                <th class="sortable" data-sort="pe">市盈率</th>
                                <th class="sortable" data-sort="pb">市净率</th>
                                <th class="sortable" data-sort="change">涨跌幅(%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for stock in stocks %}
                            <tr data-code="{{ stock.code }}"
                                data-market_cap="{{ stock.market_cap }}"
                                data-roe="{{ stock.roe }}"
                                data-net_profit="{{ stock.net_profit }}"
                                data-gross_margin="{{ stock.gross_margin }}"
                                data-pe="{{ stock.pe }}"
                                data-pb="{{ stock.pb }}"
                                data-change="{{ stock.change }}">
                                <td>{{ stock.code }}</td>
                                <td>{{ stock.name }}</td>
                                <td class="mobile-hidden">{{ "%.2f"|format(stock.market_cap) }}</td>
                                <td class="{{ 'positive' if stock.roe > 0 else 'negative' }}">{{ "%.2f"|format(stock.roe) }}</td>
                                <td class="mobile-hidden">{{ "%.2f"|format(stock.net_profit) }}</td>
                                <td class="mobile-hidden">{{ "%.2f"|format(stock.gross_margin) }}</td>
                                <td>{{ "%.2f"|format(stock.pe) if stock.pe else '-' }}</td>
                                <td>{{ "%.2f"|format(stock.pb) if stock.pb else '-' }}</td>
                                <td class="{{ 'positive' if stock.change > 0 else 'negative' }}">{{ "%.2f"|format(stock.change) }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>

                <!-- 分页 -->
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="text-muted" id="resultCount">共 {{ stocks|length }} 条数据</div>
                    <nav>
                        <ul class="pagination pagination-sm" id="pagination">
                            <!-- 分页将通过JS动态生成 -->
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
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
    </script>
</body>
</html>