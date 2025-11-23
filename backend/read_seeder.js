import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'permisionSeeder.js');
const content = fs.readFileSync(filePath, 'utf8');
console.log(content);
