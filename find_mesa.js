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
    
    console.log("Searching for Montenegro, Zona 1, Puesto 3, Mesa 4...");
    for (const rowMatch of rows) {
        const row = rowMatch[1];
        
        // Extract all cells in this row
        const cellsMatch = [...row.matchAll(/<c r="([A-Z]+)\d+"[^>]*>(?:<v>(.*?)<\/v>|<is><t[^>]*>(.*?)<\/t><\/is>)?<\/c>/g)];
        let rowData = {};
        for(const m of cellsMatch) {
            let col = m[1];
            let val = m[2];
            let isInline = m[3];
            let actualVal = '';
            
            // Check if it's a shared string (s="s")
            // Wait, we need the raw match to check type
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
            rowData[col] = actualVal;
        }
        
        // Let's dump rows that have "MONTENEGRO" or "FRANCISCO" just to be safe
        let fullText = Object.values(rowData).join(' ').toUpperCase();
        if (fullText.includes('MONTENEGRO') && fullText.includes('CALDAS') && fullText.includes('4')) {
            console.log("MATCH FOUND:");
            console.log(rowData);
        } else if (fullText.includes('MONTENEGRO') && (rowData['B'] === '01' || rowData['B'] === '1') && (rowData['C'] === '03' || rowData['C'] === '3')) {
            // Check if mesa is 4
            if(rowData['E'] === '4' || rowData['D'] === '4' || fullText.includes('4')) {
                console.log("POSSIBLE MATCH FOUND:");
                console.log(rowData);
            }
        }
    }
}
run().catch(console.error);
