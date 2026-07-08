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
    cur.execute("SELECT count(*) FROM testigos WHERE mesa_id IS NULL;")
    print("Testigos without mesa:", cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM testigos WHERE estado = 'INACTIVO' OR estado IS NULL;")
    print("Testigos inactive/null:", cur.fetchone()[0])
    cur.execute("SELECT count(*) FROM testigos WHERE tipo_testigo != 'MESA';")
    print("Testigos not MESA:", cur.fetchone()[0])
    cur.close()
    conn.close()
except Exception as e:
    print('DB Error:', e)
