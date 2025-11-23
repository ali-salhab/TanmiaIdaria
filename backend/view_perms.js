import fs from 'fs';
const content = fs.readFileSync('./controllers/permissionController.js', 'utf8');
const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes('export const getUserPermissions'));
console.log(lines.slice(startIndex, startIndex + 50).join('\n'));
