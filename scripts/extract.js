const fs = require('fs');
const unzipper = require('unzipper');

async function run() {
    const file = fs.createReadStream('C:\\Users\\JXANX\\Desktop\\Formulario Plantilla\\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx');
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
    
    const targets = [
        ["001", "02", "02"],
        ["001", "03", "02"],
        ["001", "07", "01"],
        ["001", "08", "04"],
        ["001", "98", "02"],
        ["010", "01", "02"],
        ["010", "90", "01"],
        ["010", "99", "75"],
        ["020", "99", "30"],
        ["050", "02", "02"],
        ["070", "99", "57"],
        ["080", "90", "01"],
        ["080", "99", "29"],
        ["090", "00", "00"]
    ];
    
    const rows = [...sheetContent.matchAll(/<row [^>]*>(.*?)<\/row>/g)];
    
    console.log("SQL UPDATES:");
    for (const [mpio, zona, puesto] of targets) {
        let foundName = null;
        for (const rowMatch of rows) {
            const row = rowMatch[1];
            // Look for mpio, zona, puesto
            if (row.includes(`>${mpio}<`) || row.includes(`>${mpio.replace(/^0+/,'')}<`)) {
                if (row.includes(`>${zona}<`) && row.includes(`>${puesto}<`)) {
                    const gMatch = row.match(/<c r="G\d+" s="\d+" t="(s|inlineStr)">(?:<v>(\d+)<\/v>|<is><t[^>]*>(.*?)<\/t><\/is>)<\/c>/);
                    if (gMatch) {
                        const type = gMatch[1];
                        if (type === 's') {
                            const idx = parseInt(gMatch[2], 10);
                            foundName = sharedStrings[idx];
                        } else {
                            foundName = gMatch[3];
                        }
                        if (foundName) break;
                    }
                }
            }
        }
        if (foundName) {
            console.log(`UPDATE puestos SET nombre_puesto = '${foundName.replace(/'/g, "''")}' WHERE zona = '${zona}' AND codigo_puesto = '${puesto}' AND municipio_id = (SELECT id FROM municipios WHERE codigo_municipio = '${mpio}');`);
        } else {
            console.log(`-- NOT FOUND FOR ${mpio}-${zona}-${puesto}`);
        }
    }
}
run().catch(console.error);
