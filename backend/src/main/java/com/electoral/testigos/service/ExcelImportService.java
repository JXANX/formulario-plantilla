package com.electoral.testigos.service;

import com.electoral.testigos.model.*;
import com.electoral.testigos.model.enums.AccionAuditoria;
import com.electoral.testigos.model.enums.TipoTestigo;
import com.electoral.testigos.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;

@Service
public class ExcelImportService {

    private static final Logger logger = LoggerFactory.getLogger(ExcelImportService.class);

    @Autowired
    private DepartamentoRepository departamentoRepository;

    @Autowired
    private MunicipioRepository municipioRepository;

    @Autowired
    private PuestoRepository puestoRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private TestigoRepository testigoRepository;

    @Autowired
    private AuditService auditService;

    public void importarPlantilla(InputStream is, boolean isInitialLoad) throws Exception {
        logger.info("Iniciando importación de plantilla Excel...");

        try (Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            int lastRowNum = sheet.getLastRowNum();

            // We assume row 0 is headers, data starts at row 1
            for (int i = 1; i <= lastRowNum; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                // Extract hierarchical data
                String codDepto = getCellValueAsString(row.getCell(0));
                if (codDepto.isEmpty()) continue; // Skip empty rows

                String codMpio = getCellValueAsString(row.getCell(1));
                String zona = getCellValueAsString(row.getCell(2));
                String codPuesto = getCellValueAsString(row.getCell(3));
                
                String nomDepto = getCellValueAsString(row.getCell(4));
                String nomMpio = getCellValueAsString(row.getCell(5));
                String nomPuesto = getCellValueAsString(row.getCell(6));
                
                String mesaStr = getCellValueAsString(row.getCell(7));

                // 1. Departamento
                Departamento departamento = departamentoRepository.findByCodigoDepartamento(codDepto)
                        .orElseGet(() -> departamentoRepository.save(Departamento.builder()
                                .codigoDepartamento(codDepto)
                                .nombre(nomDepto)
                                .build()));

                // 2. Municipio
                Municipio municipio = municipioRepository.findByCodigoMunicipio(codMpio)
                        .orElseGet(() -> municipioRepository.save(Municipio.builder()
                                .codigoMunicipio(codMpio)
                                .nombre(nomMpio)
                                .departamento(departamento)
                                .build()));

                // 3. Puesto
                Puesto puesto = puestoRepository.findByCodigoPuestoAndMunicipioIdAndZona(codPuesto, municipio.getId(), zona)
                        .orElseGet(() -> puestoRepository.save(Puesto.builder()
                                .codigoPuesto(codPuesto)
                                .nombrePuesto(nomPuesto)
                                .zona(zona)
                                .municipio(municipio)
                                .build()));

                // 4. Mesa
                if (!mesaStr.isEmpty()) {
                    int numMesa = Integer.parseInt(mesaStr);
                    Mesa mesa = mesaRepository.findByPuestoIdAndNumeroMesa(puesto.getId(), numMesa)
                            .orElseGet(() -> mesaRepository.save(Mesa.builder()
                                    .puesto(puesto)
                                    .numeroMesa(numMesa)
                                    .capacidad(2) // Default max 2 testigos por mesa
                                    .ocupados(0)
                                    .build()));

                    // 5. Check if there is a witness in this row
                    String nomOrg = getCellValueAsString(row.getCell(8));
                    String tipoTestigoStr = getCellValueAsString(row.getCell(9));
                    String documento = getCellValueAsString(row.getCell(10));
                    
                    if (!documento.isEmpty() && testigoRepository.findByDocumento(documento).isEmpty()) {
                        String nombre = getCellValueAsString(row.getCell(11));
                        String segundoNombre = getCellValueAsString(row.getCell(12));
                        String apellido = getCellValueAsString(row.getCell(13));
                        String segundoApellido = getCellValueAsString(row.getCell(14));
                        String celular = getCellValueAsString(row.getCell(15));
                        String correo = getCellValueAsString(row.getCell(16));

                        TipoTestigo tipo = TipoTestigo.PRINCIPAL;
                        if ("SUPLENTE".equalsIgnoreCase(tipoTestigoStr)) {
                            tipo = TipoTestigo.SUPLENTE;
                        }

                        Testigo testigo = Testigo.builder()
                                .documento(documento)
                                .nombre(nombre)
                                .segundoNombre(segundoNombre)
                                .primerApellido(apellido)
                                .segundoApellido(segundoApellido)
                                .celular(celular)
                                .correo(correo)
                                .nombreOrganizacion(nomOrg)
                                .tipoTestigo(tipo)
                                .mesa(mesa)
                                .fechaRegistro(LocalDateTime.now())
                                .build();

                        testigoRepository.save(testigo);
                        
                        // Increment mesa occupation
                        mesa.setOcupados(mesa.getOcupados() + 1);
                        mesaRepository.save(mesa);
                    }
                }
            }
            
            logger.info("Importación de plantilla finalizada correctamente.");
            
            if (!isInitialLoad) {
                auditService.log(AccionAuditoria.IMPORTACION_EXCEL, "Importación manual de plantilla Excel", "Sistema", null);
            }
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (cell.getNumericCellValue() == Math.floor(cell.getNumericCellValue())) {
                    return String.valueOf((long) cell.getNumericCellValue());
                }
                return String.valueOf(cell.getNumericCellValue());
            default:
                return "";
        }
    }
}
