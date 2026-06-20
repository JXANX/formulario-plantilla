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
    cur.execute("SELECT is_nullable FROM information_schema.columns WHERE table_name = 'acreditados' AND column_name = 'mesa_id';")
    print("acreditados.mesa_id nullable:", cur.fetchone()[0])
    cur.execute("SELECT is_nullable FROM information_schema.columns WHERE table_name = 'testigos' AND column_name = 'mesa_id';")
    print("testigos.mesa_id nullable:", cur.fetchone()[0])
    cur.close()
    conn.close()
except Exception as e:
    print('DB Error:', e)
