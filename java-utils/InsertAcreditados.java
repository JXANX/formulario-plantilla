import java.io.*;
import java.sql.*;
import java.util.*;

public class InsertAcreditados {
    static final String DB_URL = "jdbc:postgresql://aws-1-us-east-2.pooler.supabase.com:5432/postgres";
    static final String DB_USER = "postgres.htciguvegyvevuamferh";
    static final String DB_PASS = "CAMILO.BASE123";

    public static void main(String[] args) throws Exception {
        String csvPath = "acreditados_temp.csv";
        if (args.length > 0) csvPath = args[0];

        Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
        conn.setAutoCommit(false);
        System.out.println("Conectado a Supabase.");

        // Caches para evitar queries repetidas
        Map<String, Long> deptoCache = new HashMap<>();
        Map<String, Long> mpioCache = new HashMap<>();
        Map<String, Long> puestoCache = new HashMap<>();
        Map<String, Long> mesaCache = new HashMap<>();

        // Precargar departamentos
        try (ResultSet rs = conn.createStatement().executeQuery("SELECT id, codigo_departamento FROM departamentos")) {
            while (rs.next()) deptoCache.put(rs.getString("codigo_departamento"), rs.getLong("id"));
        }
        System.out.println("Departamentos en cache: " + deptoCache.size());

        // Precargar municipios
        try (ResultSet rs = conn.createStatement().executeQuery("SELECT id, codigo_municipio FROM municipios")) {
            while (rs.next()) mpioCache.put(rs.getString("codigo_municipio"), rs.getLong("id"));
        }
        System.out.println("Municipios en cache: " + mpioCache.size());

        // Precargar puestos (key = codigoPuesto|municipioId|zona)
        try (ResultSet rs = conn.createStatement().executeQuery("SELECT id, codigo_puesto, municipio_id, zona FROM puestos")) {
            while (rs.next()) {
                String key = rs.getString("codigo_puesto") + "|" + rs.getLong("municipio_id") + "|" + rs.getString("zona");
                puestoCache.put(key, rs.getLong("id"));
            }
        }
        System.out.println("Puestos en cache: " + puestoCache.size());

        // Precargar mesas (key = puestoId|numeroMesa)
        try (ResultSet rs = conn.createStatement().executeQuery("SELECT id, puesto_id, numero_mesa FROM mesas")) {
            while (rs.next()) {
                String key = rs.getLong("puesto_id") + "|" + rs.getInt("numero_mesa");
                mesaCache.put(key, rs.getLong("id"));
            }
        }
        System.out.println("Mesas en cache: " + mesaCache.size());

        // Precargar acreditados existentes por documento
        Set<String> existingDocs = new HashSet<>();
        try (ResultSet rs = conn.createStatement().executeQuery("SELECT documento FROM acreditados")) {
            while (rs.next()) existingDocs.add(rs.getString("documento"));
        }
        System.out.println("Acreditados existentes: " + existingDocs.size());

        // Preparar INSERT para acreditados
        String insertSQL = "INSERT INTO acreditados (documento, nombre_completo, celular, correo, nombre_organizacion, tipo_testigo, estado, mesa_id, fecha_registro) " +
                           "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW()) ON CONFLICT DO NOTHING";
        PreparedStatement insertStmt = conn.prepareStatement(insertSQL);

        // Leer CSV e insertar
        BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(csvPath), "UTF-8"));
        String line;
        int total = 0, inserted = 0, skipped = 0, errors = 0;
        int batchSize = 50;

        while ((line = reader.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;

            total++;
            try {
                String[] cols = parseCSVLine(line);
                if (cols.length < 15) { skipped++; continue; }

                String codDepto = cols[0].trim();
                String codMpio = cols[1].trim();
                String zona = cols[2].trim();
                String codPuesto = cols[3].trim();
                String mesaStr = cols[4].trim();
                // col 5 = nomDepto, col 6 = nomMpio, col 7 = nomPuesto (no needed for insert)
                String nomOrg = cols[8].trim();
                String documento = cols[9].trim();
                String nombre = cols[10].trim().toUpperCase();
                String correo = cols[11].trim();
                String celular = cols[12].trim();
                String tipoTestigo = cols[13].trim().toUpperCase();
                String estado = cols[14].trim();

                if (documento.isEmpty()) { skipped++; continue; }
                if (existingDocs.contains(documento)) { skipped++; continue; }

                // Buscar mesa_id
                Long mpioId = mpioCache.get(codMpio);
                if (mpioId == null) { skipped++; continue; }

                if (zona.isEmpty()) zona = "01";
                String puestoKey = codPuesto + "|" + mpioId + "|" + zona;
                Long puestoId = puestoCache.get(puestoKey);
                if (puestoId == null) { skipped++; continue; }

                int numMesa = 0;
                try {
                    String digits = mesaStr.replaceAll("[^0-9]", "");
                    if (!digits.isEmpty()) numMesa = Integer.parseInt(digits);
                } catch (Exception e) { /* ignore */ }

                String mesaKey = puestoId + "|" + numMesa;
                Long mesaId = mesaCache.get(mesaKey);
                if (mesaId == null) { skipped++; continue; }

                insertStmt.setString(1, documento);
                insertStmt.setString(2, nombre);
                insertStmt.setString(3, celular.isEmpty() ? null : celular);
                insertStmt.setString(4, correo.isEmpty() ? null : correo);
                insertStmt.setString(5, nomOrg.isEmpty() ? null : nomOrg);
                insertStmt.setString(6, tipoTestigo.isEmpty() ? null : tipoTestigo);
                insertStmt.setString(7, estado.isEmpty() ? null : estado);
                insertStmt.setLong(8, mesaId);
                insertStmt.addBatch();
                inserted++;

                if (inserted % batchSize == 0) {
                    insertStmt.executeBatch();
                    conn.commit();
                    System.out.println("  Insertados: " + inserted + " / Procesados: " + total);
                }
            } catch (Exception e) {
                errors++;
                if (errors <= 5) System.out.println("Error fila " + total + ": " + e.getMessage());
            }
        }

        // Flush remaining
        insertStmt.executeBatch();
        conn.commit();
        reader.close();

        System.out.println("\n========== RESULTADO ==========");
        System.out.println("Total filas procesadas: " + total);
        System.out.println("Insertados: " + inserted);
        System.out.println("Saltados (sin mesa/existente): " + skipped);
        System.out.println("Errores: " + errors);
        System.out.println("===============================");

        insertStmt.close();
        conn.close();
    }

    static String[] parseCSVLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    sb.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                result.add(sb.toString());
                sb = new StringBuilder();
            } else {
                sb.append(c);
            }
        }
        result.add(sb.toString());
        return result.toArray(new String[0]);
    }
}
