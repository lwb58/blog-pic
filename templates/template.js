<html>
<head>
<meta http-equiv="Content-Type" content="text/html;charset=utf-8">
<title>beautified tified report</title>
</head>
<style type="text/css">
    h1 {margin-left: 20px}
    h2 {margin-left: 20px;
        font-size: 19px;
        font-weight: bold;
        display: inline-block;
        padding-left: 10px;
        border-left: 5px solid #916dd5;}
    h3 {margin-left: 20px}
    h4 {margin-left: 20px;
        margin-bottom: -5px}
    table {margin-left: 20px;
           margin-top: 5px;
           margin-bottom: 5px}
    p {margin-left: 20px}
    a {margin-top: 200px;}
    </style>
<h1>基金策略回测报告</h1>
<body>
<h2>一、策略详情</h2>
<p>策略描述：{{ strategy_name }}</p>
<p>回测时间段：{{ start_time }} --> {{ end_time }} </p>
<p>初始本金：{{ money }}</p>
</body>
</html>

<h2>二、回测结果</h2>

<table
    border="1" width = "40%" cellspacing='0' cellpadding='0'>
<tr>
<th>基金名称</th>
<th>总投入本金</th>
<th>总收益率</th>
<th>最大回测率</th>
</tr>

{% for item in items %}
<tr align='center'>
<td>{{ item.基金名称 }}</td>
<td>{{ item.消耗本金 }}</td>
<td>{{ item.总收益率 }}</td>
<td>{{ item.最大回撤率 }}</td>
</tr>
{% endfor%}


</table>

<a name="{{ 回测指标 }}"> <img src="{{ indicator }}" width="850"></a>