import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'routes', 'auth.js');

let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/if \(perm\?\.name\) mergedPermissions\.add\(perm\.name\);/g, 'if (perm?.key) mergedPermissions.add(perm.key);');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Fixed auth.js permissions field from "name" to "key"');
