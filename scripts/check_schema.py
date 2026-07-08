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
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'testigos';")
    print("TESTIGOS SCHEMA:")
    for col in cur.fetchall():
        print(f"  {col[0]}: {col[1]}")
        
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'acreditados';")
    print("\nACREDITADOS SCHEMA:")
    for col in cur.fetchall():
        print(f"  {col[0]}: {col[1]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print('DB Error:', e)
