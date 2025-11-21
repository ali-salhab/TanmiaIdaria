import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const permControllerPath = path.join(__dirname, 'controllers', 'permissionController.js');
const content = fs.readFileSync(permControllerPath, 'utf8');

console.log('=== PERMISSION CONTROLLER ENDPOINTS ===\n');

const getEndpointInfo = (funcName, searchStr) => {
  const regex = new RegExp(`export const ${funcName}\\s*=\\s*async.*?\\n\\s*try\\s*\\{[\\s\\S]*?res\\..*?\\(.*?\\);`, 'm');
  const match = content.match(regex);
  if (match) {
    const funcContent = match[0];
    const returnMatch = funcContent.match(/res\.\w+\([^)]*\)/);
    console.log(`✓ ${funcName}`);
    if (returnMatch) {
      console.log(`  Returns: ${returnMatch[0]}`);
    }
  } else {
    console.log(`✗ ${funcName} - NOT FOUND`);
  }
};

getEndpointInfo('getAllPermissions');
getEndpointInfo('createPermission');
getEndpointInfo('getAllGroups');
getEndpointInfo('createGroup');
getEndpointInfo('updateGroup');
getEndpointInfo('deleteGroup');
getEndpointInfo('addUserToGroup');
getEndpointInfo('removeUserFromGroup');
getEndpointInfo('getUserPermissions');
getEndpointInfo('updateUserPermissions');

console.log('\n=== CHECKING RETURN STRUCTURES ===\n');

const userPermsMatch = content.match(/export const getUserPermissions[\s\S]*?(?=\n\nexport const)/);
if (userPermsMatch) {
  console.log('getUserPermissions returns:');
  const returnStmts = userPermsMatch[0].match(/res\.json\([^;]*\);/g);
  if (returnStmts) {
    returnStmts.forEach(stmt => console.log('  -', stmt.substring(0, 80) + '...'));
  }
}

const updateUserPermsMatch = content.match(/export const updateUserPermissions[\s\S]*?(?=\n\nexport const|$)/);
if (updateUserPermsMatch) {
  console.log('\nupdateUserPermissions returns:');
  const returnStmts = updateUserPermsMatch[0].match(/res\.json\([^;]*\);/g);
  if (returnStmts) {
    returnStmts.forEach(stmt => console.log('  -', stmt.substring(0, 80) + '...'));
  }
}
