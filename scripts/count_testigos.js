const fs = require('fs');
const unzipper = require('unzipper');

async function run() {
    const file = fs.createReadStream('C:\\Users\\shinm\\OneDrive\\Escritorio\\formulario-plantilla\\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx');
    const zip = file.pipe(unzipper.Parse({forceStream: true}));
    let sharedStrings = [];
    let sheetContent = '';
    
    for await (const entry of zip) {
        if (entry.path === 'xl/sharedStrings.xml') {
            const content = await entry.buffer();
            const str = content.toString();
            const matches = [...str.matchAll(/<t[^>]*>(.*?)<\/t>/g)];
            sharedStrings = matches.map(m => m[1]);
        } else if (entry.path.startsWith('xl/worksheets/sheet')) {
            if (!sheetContent) {
                const content = await entry.buffer();
                sheetContent = content.toString();
            } else {
                entry.autodrain();
            }
        } else {
            entry.autodrain();
        }
    }
    
    const rows = [...sheetContent.matchAll(/<row [^>]*>(.*?)<\/row>/g)];
    
    let totalTestigos = 0;
    let validTestigos = 0;
    let blankRows = 0;
    
    for (const rowMatch of rows) {
        const row = rowMatch[1];
        const cellsMatch = [...row.matchAll(/<c r="([A-Z]+)\d+"[^>]*>(?:<v>(.*?)<\/v>|<is><t[^>]*>(.*?)<\/t><\/is>)?<\/c>/g)];
        let rowData = {};
        for(const m of cellsMatch) {
            let col = m[1];
            let val = m[2];
            let isInline = m[3];
            let actualVal = '';
            
            const rawCell = m[0];
            const typeMatch = rawCell.match(/t="([^"]+)"/);
            const type = typeMatch ? typeMatch[1] : '';
            
            if (type === 's' && val) {
                actualVal = sharedStrings[parseInt(val, 10)];
            } else if (isInline) {
                actualVal = isInline;
            } else if (val) {
                actualVal = val;
            }
            rowData[col] = actualVal ? actualVal.trim() : '';
        }
        
        // Col K is Cedula, L is Nombre, N is Apellido
        // Only count if there is a Dpto (Col E) to skip header maybe
        if (rowData['E'] === 'QUINDIO') {
            totalTestigos++;
            // Check if it has a cedula
            if (rowData['K'] && rowData['K'].length > 0) {
                validTestigos++;
            } else {
                blankRows++;
            }
        }
    }
    
    console.log(`Total rows with QUINDIO: ${totalTestigos}`);
    console.log(`Rows with a valid Cedula (Testigos reales): ${validTestigos}`);
    console.log(`Rows blank (No cedula): ${blankRows}`);
}

run().catch(console.error);
