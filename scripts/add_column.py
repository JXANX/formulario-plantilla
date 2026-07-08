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
    cur.execute("ALTER TABLE puestos ADD COLUMN IF NOT EXISTS coordinador_acreditado_id bigint;")
    conn.commit()
    cur.close()
    conn.close()
    print("Column added")
except Exception as e:
    print('DB Error:', e)
