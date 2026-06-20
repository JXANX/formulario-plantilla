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
    cur.execute("SELECT p.codigo_puesto, p.nombre_puesto, count(m.id) FROM puestos p JOIN mesas m ON p.id = m.puesto_id GROUP BY p.codigo_puesto, p.nombre_puesto ORDER BY count(m.id) DESC LIMIT 10;")
    for row in cur.fetchall():
        print(row)
    
    cur.execute("SELECT m.numero_mesa, count(*) FROM mesas m GROUP BY m.numero_mesa ORDER BY count(*) DESC LIMIT 5;")
    for row in cur.fetchall():
        print(row)
        
    cur.execute("SELECT count(*) FROM mesas WHERE numero_mesa = 0;")
    print("Mesas with numero 0:", cur.fetchone()[0])
    
    cur.close()
    conn.close()
except Exception as e:
    print('DB Error:', e)
