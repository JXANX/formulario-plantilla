package com.electoral.testigos;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.File;
import java.io.FileInputStream;
import java.util.HashMap;
import java.util.Map;

public class FixPuestos {
    public static void main(String[] args) throws Exception {
        File file = new File("C:\\Users\\JXANX\\Desktop\\Formulario Plantilla\\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx");
        FileInputStream fis = new FileInputStream(file);
        Workbook workbook = new XSSFWorkbook(fis);
        Sheet sheet = workbook.getSheetAt(0);
        
        Map<String, String> names = new HashMap<>();
        
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;
            
            String mpio = getVal(row.getCell(1));
            String zona = getVal(row.getCell(2));
            String puesto = getVal(row.getCell(3));
            String nombre = getVal(row.getCell(6));
            
            String key = mpio + "-" + zona + "-" + puesto;
            if (!nombre.isEmpty() && !names.containsKey(key)) {
                names.put(key, nombre);
            }
        }
        
        String[][] targets = {
            {"001", "02", "02"},
            {"001", "03", "02"},
            {"001", "07", "01"},
            {"001", "08", "04"},
            {"001", "98", "02"},
            {"010", "01", "02"},
            {"010", "90", "01"},
            {"010", "99", "75"},
            {"020", "99", "30"},
            {"050", "02", "02"},
            {"070", "99", "57"},
            {"080", "90", "01"},
            {"080", "99", "29"},
            {"090", "00", "00"}
        };
        
        System.out.println("SQL UPDATES:");
        for (String[] t : targets) {
            String key = t[0] + "-" + t[1] + "-" + t[2];
            String name = names.get(key);
            if (name != null) {
                System.out.println("UPDATE puestos SET nombre_puesto = '" + name.replace("'", "''") + 
                    "' WHERE zona = '" + t[1] + "' AND codigo_puesto = '" + t[2] + 
                    "' AND municipio_id = (SELECT id FROM municipios WHERE codigo_municipio = '" + t[0] + "');");
            } else {
                System.out.println("-- NO NAME FOUND FOR " + key);
            }
        }
        
        workbook.close();
        fis.close();
    }
    
    private static String getVal(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue().trim();
        if (cell.getCellType() == CellType.NUMERIC) {
            double d = cell.getNumericCellValue();
            if (d == (long) d) return String.format("%02d", (long) d);
            return String.valueOf(d);
        }
        return "";
    }
}
