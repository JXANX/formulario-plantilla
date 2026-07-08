import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

public class AddMesa {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-us-east-2.pooler.supabase.com:5432/postgres";
        String user = "postgres.htciguvegyvevuamferh";
        String password = "CAMILO.BASE123";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            
            // 1. Encontrar el municipio Montenegro
            String mpioQuery = "SELECT id FROM municipios WHERE UPPER(nombre) LIKE '%MONTENEGRO%' LIMIT 1";
            Long mpioId = null;
            try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(mpioQuery)) {
                if (rs.next()) {
                    mpioId = rs.getLong("id");
                    System.out.println("Municipio MONTENEGRO encontrado con ID: " + mpioId);
                } else {
                    System.out.println("No se encontró el municipio MONTENEGRO");
                    return;
                }
            }

            // 2. Encontrar el puesto
            String puestoQuery = "SELECT id FROM puestos WHERE municipio_id = ? AND zona = '1' AND (codigo_puesto = '3' OR codigo_puesto = '03') LIMIT 1";
            Long puestoId = null;
            try (PreparedStatement pstmt = conn.prepareStatement(puestoQuery)) {
                pstmt.setLong(1, mpioId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        puestoId = rs.getLong("id");
                        System.out.println("Puesto ESC FRANCISCO JOSE DE CALDAS encontrado con ID: " + puestoId);
                    } else {
                        System.out.println("No se encontró el puesto con cod=3 zona=1 en MONTENEGRO. Vamos a intentar buscar por nombre.");
                        String p2Query = "SELECT id FROM puestos WHERE municipio_id = ? AND UPPER(nombre_puesto) LIKE '%CALDAS%' LIMIT 1";
                        try (PreparedStatement p2 = conn.prepareStatement(p2Query)) {
                            p2.setLong(1, mpioId);
                            try (ResultSet rs2 = p2.executeQuery()) {
                                if (rs2.next()) {
                                    puestoId = rs2.getLong("id");
                                    System.out.println("Puesto encontrado por nombre con ID: " + puestoId);
                                } else {
                                    System.out.println("No se encontró el puesto de ninguna forma.");
                                    return;
                                }
                            }
                        }
                    }
                }
            }

            // 3. Comprobar si la mesa ya existe
            String checkMesaQuery = "SELECT id FROM mesas WHERE puesto_id = ? AND numero_mesa = 4";
            try (PreparedStatement pstmt = conn.prepareStatement(checkMesaQuery)) {
                pstmt.setLong(1, puestoId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        System.out.println("La Mesa 4 ya existe en este puesto con ID: " + rs.getLong("id"));
                    } else {
                        // 4. Insertar la mesa
                        String insertMesa = "INSERT INTO mesas (numero_mesa, capacidad, ocupados, puesto_id) VALUES (4, 2, 0, ?)";
                        try (PreparedStatement insertStmt = conn.prepareStatement(insertMesa)) {
                            insertStmt.setLong(1, puestoId);
                            insertStmt.executeUpdate();
                            System.out.println("Mesa 4 insertada correctamente.");
                        }
                    }
                }
            }

            // 5. Contar mesas totales
            try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery("SELECT COUNT(*) as total FROM mesas")) {
                if (rs.next()) {
                    System.out.println("Total de mesas actualmente en la BD: " + rs.getInt("total"));
                }
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
