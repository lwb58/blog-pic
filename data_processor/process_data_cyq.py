import pandas as pd
import redis
from contextlib import contextmanager
import datetime
import requests
from typing import Optional, Dict, Any
import json
import schedule
import time
from wxpusher import WxPusher
import dataframe_image as dfi
# 配置信息（建议从环境变量获取）
from jinja2 import Template,Environment, FileSystemLoader
import os
import subprocess
import threading
# 业绩超预期数据获取

REDIS_CONFIG = {
    "host": "114.132.123.30",
    "port": 9822,
    "password": "u6xfqwURzHki!8s@7y$g4512",
    "db": 0,
    "max_connections": 10,
    "socket_timeout": 5,
    "socket_connect_timeout": 5,
    "decode_responses": True,
}

XINGE_CONFIG = {
    "access_id": "YOUR_XINGE_ACCESS_ID",
    "access_key": "YOUR_XINGE_ACCESS_KEY",
    "api_url": "https://openapi.xg.qq.com/v3/push/app"
}

# 全局连接池
_redis_pool = None

def getUser():
    users = WxPusher.query_user('1', '10', 'AT_Ru9r2jFeGTRjuqPNKYOJvdJ0ESPoJK1m')
    records = users['data']['records']
    return records

def get_redis_pool():
    """获取Redis连接池（单例）"""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = redis.ConnectionPool(**REDIS_CONFIG)
    return _redis_pool


@contextmanager
def redis_connection():
    """Redis连接上下文管理器"""
    conn = None
    try:
        conn = redis.Redis(connection_pool=get_redis_pool())
        yield conn
    except redis.RedisError as e:
        print(f"Redis操作错误: {e}")
        raise
    finally:
        if conn:
            conn.close()


def get_previous_trading_day(current_date: datetime.date) -> datetime.date:
    """获取前一个交易日"""
    # 这里需要实现获取真实交易日的逻辑
    # 简化版：如果是周一，返回上周五，否则返回前一天
    return current_date - datetime.timedelta(days=3)


def get_redis_data(target_date: datetime.date) -> Optional[Dict[str, Any]]:
    """从Redis获取指定日期的数据"""
    date_str = target_date.strftime("%Y-%m-%d")
    try:
        with redis_connection() as conn:
            data = conn.get(date_str)
            if data:
                try:
                    return json.loads(data)
                except json.JSONDecodeError:
                    return {"raw_data": data}
    except Exception as e:
        print(f"获取Redis数据失败: {e}")
    return None
def save_and_upload_picgo(df, file_path):
    df_styled = df.style.background_gradient()
    dfi.export(df_styled, file_path,max_rows=-1)
    url = upload_to_picgo(file_path)['result'][0]
    return url

def upload_to_picgo(image_path, picgo_url='http://127.0.0.1:36677/upload'):
    try:
        # 构建请求体
        payload = json.dumps({'list': [image_path]})

        # 发送HTTP POST请求
        response = requests.post(picgo_url, data=payload, headers={'Content-Type': 'application/json'})

        # 检查上传是否成功
        if response.status_code == 200:
            print('图片上传成功')
            return response.json()  # 返回JSON响应
        else:
            print('图片上传失败，状态码：', response.status_code)
            return None
    except requests.exceptions.RequestException as e:
        print(f'请求异常：{e}')
        return None

def send_xinge_notification(data: Dict[str, Any]) -> bool:
    """通过腾讯信鸽发送通知"""
    try:
        payload = {
            "platform": "android",
            "audience_type": "all",
            "message_type": "notify",
            "message": {
                "title": "每日数据更新",
                "content": json.dumps(data, ensure_ascii=False)[:100] + "...",
                "android": {
                    "ring": 1,
                    "vibrate": 1
                }
            }
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {XINGE_CONFIG['access_key']}"
        }

        response = requests.post(
            XINGE_CONFIG["api_url"],
            json=payload,
            headers=headers,
            auth=(XINGE_CONFIG["access_id"], XINGE_CONFIG["access_key"]),
            timeout=10
        )

        return response.status_code == 200
    except Exception as e:
        print(f"信鸽推送失败: {e}")
        return False

def pushMsg(records, name, content):
    content = "<h1>{}最新业绩报告超预期股票:</h1><br/><p style=\"color:red;\">{}</p>".format(name, content)
    for record in records:
        res = WxPusher.send_message(content=content,
                                    uids=[record['uid']],
                                    topicIds=[],
                                    token='AT_Ru9r2jFeGTRjuqPNKYOJvdJ0ESPoJK1m')
        print(res)

def daily_task():
    """每日定时任务"""
    today = datetime.date.today()
    previous_trading_day = get_previous_trading_day(today)

    print(f"正在获取 {previous_trading_day} 的数据...")
    data = get_redis_data(previous_trading_day)

    if data:
        print(f"获取到数据: {data}")
        users = getUser()
        df = pd.DataFrame.from_dict({stock['co']:{k:v for k,v in stock.items() if k !="co"} for stock in data.values()})
        df = df.T
        df_sorted = df.sort_values("至今涨幅")
        save_html(df_sorted)
    else:
        print("未获取到有效数据")

def df_to_html(df: pd.DataFrame) -> str:
    """将DataFrame转换为HTML表格（带样式类）"""
    return df.to_html(
        classes="dataframe table table-striped",
        border=0,
        index=False,
        justify="left"
    )


def prepare_data(df):
    # 字段重命名（英文名需与模板完全一致）
    df = df.rename(columns={
        'na': 'na',  # 股票名称
        'co': 'co',  # 股票代码
        '公告日': 'pubdate',
        '涨幅': 'change',
        '次日': 'nextDate',
        '市值': 'market_cap',
        'ROE': 'roe',
        '扣非归母净利润': 'net_profit',
        '毛利率': 'gross_margin',
        '市盈率(pe)': 'pe',
        '市净率(pb)': 'pb',
        '至今涨幅': 'zjzf',
    })
    df = df.reset_index().rename(columns={'index': 'co'})
    # 确保数值字段为float类型
    numeric_cols = ['market_cap', 'roe', 'net_profit', 'gross_margin', 'pe', 'pb', 'change']
    df[numeric_cols] = df[numeric_cols].astype(float)

    return df


def save_html(df_sorted):
    os.makedirs("../data", exist_ok=True)
    df_sorted.to_parquet("../data/latest.parquet")
    df_sorted.to_csv("../data/latest.csv")

    df = prepare_data(df_sorted)

    # 渲染模板
    env = Environment(loader=FileSystemLoader('../templates/'))
    template = env.get_template('template.html')

    with open("../index.html", "w", encoding='utf-8') as f:
        f.write(template.render(
            stocks=df.to_dict('records'),
            update_time=pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
        ))
    update_github()


# 1. 你的数据获取逻辑（替换为实际代码）
def fetch_data():
    return {"timestamp": datetime.datetime.isoformat(), "value": 42}

def git_push():
    subprocess.run(["git", "add","."])
    subprocess.run(["git", "commit","-m","Auto data update"])
    subprocess.run(["git", "push"])


# 2. 克隆GitHub仓库（需提前安装Git）
def update_github():
    repo_url = "https://github.com/lwb58/blog-pic.git"
    repo_dir = "C:\\code\\blog-pic"

    if not os.path.exists(repo_dir):
        os.system(f"git clone {repo_url} {repo_dir}")

    os.chdir(repo_dir)
    #os.system("git pull")  # 拉取最新代码

    # 提交到GitHub
    #os.system('git add .')
    #os.system('git commit -m "Auto data update"')
    threading.Thread(target=git_push).start()


if __name__ == '__main__':
    # schedule.every(0.1).minutes.do(trace)
    schedule.every().day.at("01:25").do(daily_task)
    # schedule.every().day.at("13:05").do(daily_task)
    # daily_task()
    while True:
        schedule.run_pending()
        time.sleep(30)
