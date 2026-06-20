import csv
import psycopg2

def get_key(row, key_sub):
    for k in row.keys():
        if k and key_sub in k:
            return row[k]
    return ''

conn = psycopg2.connect(
    dbname='postgres',
    user='postgres.htciguvegyvevuamferh',
    password='CAMILO.BASE123',
    host='aws-1-us-east-2.pooler.supabase.com',
    port=5432
)
cur = conn.cursor()
cur.execute("SELECT documento FROM testigos")
existing = {row[0] for row in cur.fetchall()}
cur.close()
conn.close()

with open('ultimos acreditados/QUINDIO_Mesas_Pendientes.csv', 'r', encoding='latin-1') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        doc = str(get_key(row, 'Identificac')).strip()
        if doc in existing:
            print(f"ALREADY IN DB: {doc} - {get_key(row, 'Nombre y')}")
