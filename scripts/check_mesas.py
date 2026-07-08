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
    cur.execute("SELECT count(*) FROM mesas;")
    print("Total mesas:", cur.fetchone()[0])
    cur.close()
    conn.close()
except Exception as e:
    print('DB Error:', e)
