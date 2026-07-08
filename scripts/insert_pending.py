import psycopg2
import csv
import re

DB_URL = {
    'dbname': 'postgres',
    'user': 'postgres.htciguvegyvevuamferh',
    'password': 'CAMILO.BASE123',
    'host': 'aws-1-us-east-2.pooler.supabase.com',
    'port': 5432
}

def split_name(full_name):
    parts = full_name.split()
    if len(parts) == 1:
        return parts[0], '', '', ''
    elif len(parts) == 2:
        return parts[0], '', parts[1], ''
    elif len(parts) == 3:
        return parts[0], '', parts[1], parts[2]
    else:
        return parts[0], parts[1], parts[2], ' '.join(parts[3:])

def get_key(row, key_sub):
    for k in row.keys():
        if k and key_sub in k:
            return row[k]
    return ''

def main():
    conn = psycopg2.connect(**DB_URL)
    cur = conn.cursor()

    # Caches
    cur.execute("SELECT codigo_municipio, id FROM municipios")
    mpio_cache = {row[0]: row[1] for row in cur.fetchall()}

    cur.execute("SELECT codigo_puesto, municipio_id, zona, id FROM puestos")
    puesto_cache = {f"{row[0]}|{row[1]}|{row[2]}": row[3] for row in cur.fetchall()}

    cur.execute("SELECT puesto_id, numero_mesa, id FROM mesas")
    mesa_cache = {f"{row[0]}|{row[1]}": row[2] for row in cur.fetchall()}

    cur.execute("SELECT documento FROM testigos")
    existing_testigos = {row[0] for row in cur.fetchall()}

    cur.execute("SELECT documento FROM acreditados")
    existing_acreditados = {row[0] for row in cur.fetchall()}

    # Read CSV
    inserted_testigos = 0
    inserted_acreditados = 0
    skipped_testigos = 0
    skipped_acreditados = 0
    total_found = 0

    with open('ultimos acreditados/QUINDIO_Mesas_Pendientes.csv', 'r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            total_found += 1
            cod_mpio = get_key(row, 'MUNICIPIO').zfill(3)
            if not cod_mpio:
                cod_mpio = '001'
            zona = get_key(row, 'ZONA').zfill(2)
            if not zona:
                zona = '01'
            cod_puesto = get_key(row, 'PUESTO').zfill(2)
            if not cod_puesto:
                cod_puesto = '01'
            
            mesa_str = get_key(row, 'MESA')
            num_mesa = 0
            if mesa_str:
                digits = re.sub(r'[^0-9]', '', mesa_str)
                if digits:
                    num_mesa = int(digits)

            doc = str(get_key(row, 'Identificac')).strip()
            if not doc:
                continue

            # Resolve mesa_id
            mpio_id = mpio_cache.get(cod_mpio)
            if not mpio_id:
                print(f"Skipping {doc}: mpio {cod_mpio} not found")
                continue
                
            puesto_key = f"{cod_puesto}|{mpio_id}|{zona}"
            puesto_id = puesto_cache.get(puesto_key)
            if not puesto_id:
                print(f"Skipping {doc}: puesto {puesto_key} not found")
                continue
                
            mesa_key = f"{puesto_id}|{num_mesa}"
            mesa_id = mesa_cache.get(mesa_key)
            if not mesa_id:
                print(f"Skipping {doc}: mesa {mesa_key} not found")
                continue

            full_name = str(get_key(row, 'Nombre y')).strip().upper()
            org = str(get_key(row, 'Organizaci')).strip()
            celular = str(get_key(row, 'Tel')).strip()
            correo = str(get_key(row, 'Correo')).strip()
            tipo = str(get_key(row, 'Tipo')).strip().upper()

            # Insert into testigos
            if doc not in existing_testigos:
                n1, n2, a1, a2 = split_name(full_name)
                cur.execute(
                    "INSERT INTO testigos (documento, nombre, segundo_nombre, primer_apellido, segundo_apellido, celular, correo, nombre_organizacion, tipo_testigo, mesa_id, fecha_registro) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())",
                    (doc, n1, n2, a1, a2, celular or None, correo or None, org or None, tipo or None, mesa_id)
                )
                inserted_testigos += 1
                existing_testigos.add(doc)
            else:
                skipped_testigos += 1

            # Insert into acreditados
            if doc not in existing_acreditados:
                cur.execute(
                    "INSERT INTO acreditados (documento, nombre_completo, celular, correo, nombre_organizacion, tipo_testigo, estado, mesa_id, fecha_registro) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())",
                    (doc, full_name, celular or None, correo or None, org or None, tipo or None, 'Acreditado', mesa_id)
                )
                inserted_acreditados += 1
                existing_acreditados.add(doc)
            else:
                skipped_acreditados += 1

    conn.commit()

    cur.execute("SELECT COUNT(*) FROM testigos")
    total_testigos = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM acreditados")
    total_acreditados = cur.fetchone()[0]

    print("--- RESULTADOS FASE 1 ---")
    print(f"Registros encontrados: {total_found}")
    print(f"Registros insertados en testigos: {inserted_testigos} (Saltados: {skipped_testigos})")
    print(f"Registros insertados en acreditados: {inserted_acreditados} (Saltados: {skipped_acreditados})")
    print(f"Total final en testigos: {total_testigos}")
    print(f"Total final en acreditados: {total_acreditados}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
