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
    cur.execute("SELECT count(*) FROM testigos WHERE mesa_id IN (SELECT id FROM mesas WHERE numero_mesa = 0);")
    print("Testigos in Mesa 0:", cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM acreditados WHERE mesa_id IN (SELECT id FROM mesas WHERE numero_mesa = 0);")
    print("Acreditados in Mesa 0:", cur.fetchone()[0])
    cur.close()
    conn.close()
except Exception as e:
    print('DB Error:', e)
