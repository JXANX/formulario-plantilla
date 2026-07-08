import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckDB {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-us-east-2.pooler.supabase.com:5432/postgres";
        String user = "postgres.htciguvegyvevuamferh";
        String password = "CAMILO.BASE123";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            String[] tables = {"testigos", "mesas", "puestos", "municipios", "departamentos"};
            for (String table : tables) {
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM " + table)) {
                    if (rs.next()) {
                        System.out.println(table + ": " + rs.getInt(1));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
