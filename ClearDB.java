import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class ClearDB {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-us-east-2.pooler.supabase.com:5432/postgres";
        String user = "postgres.htciguvegyvevuamferh";
        String password = "CAMILO.BASE123";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Borrando tablas...");
            stmt.executeUpdate("TRUNCATE TABLE testigos, mesas, puestos, municipios, departamentos CASCADE;");
            System.out.println("Tablas borradas con éxito.");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
