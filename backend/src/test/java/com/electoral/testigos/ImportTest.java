package com.electoral.testigos;

import com.electoral.testigos.service.ExcelImportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.File;
import java.io.FileInputStream;

@SpringBootTest
public class ImportTest {

    @Autowired
    private ExcelImportService excelImportService;

    @Test
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.test.annotation.Rollback(false)
    public void runImport() throws Exception {
        File file = new File("C:\\Users\\JXANX\\Desktop\\Formulario Plantilla\\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx");
        System.out.println("====== STARTING IMPORT ======");
        try (FileInputStream fis = new FileInputStream(file)) {
            excelImportService.importarPlantilla(fis, false);
            System.out.println("====== IMPORT COMPLETE ======");
        } catch(Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
