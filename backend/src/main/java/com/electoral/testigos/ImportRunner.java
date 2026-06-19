package com.electoral.testigos;

import com.electoral.testigos.service.ExcelImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;

@Component
public class ImportRunner implements CommandLineRunner {

    @Autowired
    private ExcelImportService excelImportService;

    @Override
    public void run(String... args) throws Exception {
        if (args.length > 0 && "run-import".equals(args[0])) {
            System.out.println("====== STARTING IMPORT FROM COMMAND LINE ======");
            File file = new File("C:\\Users\\JXANX\\Desktop\\Formulario Plantilla\\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx");
            try (FileInputStream fis = new FileInputStream(file)) {
                excelImportService.importarPlantilla(fis, false);
                System.out.println("====== IMPORT COMPLETE ======");
            } catch(Exception e) {
                e.printStackTrace();
            }
            System.exit(0);
        }
    }
}
