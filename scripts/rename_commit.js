const fs = require('fs');
let msg = fs.readFileSync(0, 'utf-8').trim();

const lowerMsg = msg.toLowerCase();
let newMsg = msg;

if (lowerMsg === 'oh si') newMsg = 'chore: update UI elements';
else if (lowerMsg === 'uy') newMsg = 'fix: minor adjustments';
else if (lowerMsg === 'reporte') newMsg = 'feat: add witness per municipality report';
else if (lowerMsg === 'funcion excel para municipios') newMsg = 'feat: export witnesses by municipality to Excel';
else if (lowerMsg === 'boton limpiar campos') newMsg = 'feat: add clear all fields button';
else if (lowerMsg.startsWith('priorizar')) newMsg = 'feat: adjust dashboard cards priority';
else if (lowerMsg === 'acatualizacion metricas') newMsg = 'fix: update dashboard deficit metrics';
else if (lowerMsg === 'coordinador mejorado') newMsg = 'feat: improve coordinator management UI';
else if (lowerMsg === 'fix') newMsg = 'fix: resolve minor bugs';
else if (lowerMsg.includes('gitign')) newMsg = 'chore: update gitignore rules';
else if (lowerMsg === 'prueba') newMsg = 'chore: test commit';
else if (lowerMsg.includes('desplegable')) newMsg = 'fix: correct dropdown components behavior';
else if (lowerMsg === 'correccion') newMsg = 'fix: apply minor corrections';
else if (lowerMsg.includes('mejoras y logs')) newMsg = 'feat: implement improvements and audit logs';
else if (lowerMsg.match(/^check\s*\d*/)) newMsg = 'chore: intermediate checkpoint';
else if (lowerMsg === 'logocabecerabien') newMsg = 'feat: add header logo properly';
else if (lowerMsg.includes('favicon')) newMsg = 'chore: update favicon';
else if (lowerMsg.startsWith('shi')) newMsg = 'chore: minor updates';
else if (lowerMsg.startsWith('color')) newMsg = 'style: adjust color palette';
else if (lowerMsg.includes('checkbox')) newMsg = 'feat: add checkbox functionality';
else if (lowerMsg === 'bugs corregidos') newMsg = 'fix: resolve miscellaneous bugs';
else if (lowerMsg.startsWith('responsive')) newMsg = 'style: improve responsive design layout';
else if (lowerMsg === 'graficas') newMsg = 'feat: add dashboard chart visualizations';
else if (lowerMsg === 'alfabetic') newMsg = 'feat: sort list items alphabetically';

console.log(newMsg);
