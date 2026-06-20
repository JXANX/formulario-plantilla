import psycopg2

try:
    conn = psycopg2.connect(
        dbname='postgres',
        user='postgres.htciguvegyvevuamferh',
        password='CAMILO.BASE123',
        host='aws-1-us-east-2.pooler.supabase.com',
        port=5432
    )
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
    tables = cur.fetchall()
    for table in tables:
        tname = table[0]
        cur.execute(f"SELECT COUNT(*) FROM {tname}")
        count = cur.fetchone()[0]
        print(f"{tname}: {count}")
    cur.close()
    conn.close()
except Exception as e:
    print('DB Error:', e)
