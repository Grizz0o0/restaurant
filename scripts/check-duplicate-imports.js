const fs = require('fs');
const path = require('path');
const glob = require('glob'); // Need to check if available, or just traverse manually.

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else if (fullPath.endsWith('.module.ts')) {
      callback(fullPath);
    }
  }
}

function checkDuplicateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find @Module decorator
  const moduleRegex = /@Module\s*\(\s*\{([\s\S]*?)\}\s*\)/;
  const match = content.match(moduleRegex);
  if (!match) return;

  const moduleConfig = match[1];

  // Simple parser to extract imports array
  const importsMatch = moduleConfig.match(/imports\s*:\s*\[([\s\S]*?)\]/);
  if (!importsMatch) return;

  const importsText = importsMatch[1];
  
  // Strip comments
  const noComments = importsText.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  
  // Split by comma
  const items = noComments.split(',').map(item => item.trim()).filter(Boolean);
  
  const seen = new Set();
  const duplicates = new Set();

  for (const item of items) {
       // Clean up the item (e.g. TRPCModule.forRoot(...) -> TRPCModule)
       const baseModule = item.split(/\.|\(/)[0];
       
       if (baseModule) {
           if (seen.has(baseModule)) {
               duplicates.add(baseModule);
           }
           seen.add(baseModule);
       }
  }

  if (duplicates.size > 0) {
    console.log(`[Duplicate Import Found] File: ${filePath}`);
    console.log(`Duplicates: ${Array.from(duplicates).join(', ')}\n`);
  }
}

const targetDir = path.resolve(__dirname, '../apps/api/src');
walkDir(targetDir, checkDuplicateImports);
console.log('Duplicate check complete.');
