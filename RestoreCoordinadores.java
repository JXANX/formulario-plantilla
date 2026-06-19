import java.io.BufferedReader;
import java.io.FileReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class RestoreCoordinadores {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-us-east-2.pooler.supabase.com:5432/postgres";
        String user = "postgres.htciguvegyvevuamferh";
        String password = "CAMILO.BASE123";
        String csvFile = "c:\\Users\\JXANX\\Desktop\\Formulario Plantilla\\coordinadores_backup.csv";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             BufferedReader br = new BufferedReader(new FileReader(csvFile))) {
            
            String updateSQL = "UPDATE puestos SET coordinador_id = ? WHERE id = ?";
            String findTestigoSQL = "SELECT id FROM testigos WHERE documento = ?";
            String findPuestoSQL = "SELECT p.id FROM puestos p JOIN municipios m ON p.municipio_id = m.id WHERE p.codigo_puesto = ? AND p.zona = ? AND m.codigo_municipio = ?";

            try (PreparedStatement updateStmt = conn.prepareStatement(updateSQL);
                 PreparedStatement findTestigoStmt = conn.prepareStatement(findTestigoSQL);
                 PreparedStatement findPuestoStmt = conn.prepareStatement(findPuestoSQL)) {

                String line;
                int count = 0;
                int failed = 0;

                while ((line = br.readLine()) != null) {
                    if (line.trim().isEmpty()) continue;
                    line = line.replace("\uFEFF", ""); // Remove BOM
                    String[] parts = line.split(",");
                    if (parts.length != 4) continue;

                    String codigoMunicipio = parts[0];
                    String codigoPuesto = parts[1];
                    String zona = parts[2];
                    String documento = parts[3];

                    // Find Testigo
                    findTestigoStmt.setString(1, documento);
                    Long testigoId = null;
                    try (ResultSet rs = findTestigoStmt.executeQuery()) {
                        if (rs.next()) {
                            testigoId = rs.getLong("id");
                        }
                    }

                    // Find Puesto
                    findPuestoStmt.setString(1, codigoPuesto);
                    findPuestoStmt.setString(2, zona);
                    findPuestoStmt.setString(3, codigoMunicipio);
                    Long puestoId = null;
                    try (ResultSet rs = findPuestoStmt.executeQuery()) {
                        if (rs.next()) {
                            puestoId = rs.getLong("id");
                        }
                    }

                    if (testigoId != null && puestoId != null) {
                        updateStmt.setLong(1, testigoId);
                        updateStmt.setLong(2, puestoId);
                        updateStmt.executeUpdate();
                        count++;
                    } else {
                        System.out.println("Fallo al restaurar: Municipio=" + codigoMunicipio + ", Puesto=" + codigoPuesto + ", Zona=" + zona + ", Testigo=" + documento);
                        if (testigoId == null) System.out.println("  -> Testigo no encontrado en la BD actual");
                        if (puestoId == null) System.out.println("  -> Puesto no encontrado en la BD actual");
                        failed++;
                    }
                }

                System.out.println("Restauracion completada. " + count + " coordinadores asignados exitosamente.");
                if (failed > 0) {
                    System.out.println("Hubo " + failed + " fallos.");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
