import { Project, SyntaxKind } from 'ts-morph';
import * as path from 'path';

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), 'apps/api/tsconfig.json'),
});

const sourceFiles = project.getSourceFiles();
let totalDuplicates = 0;

for (const sourceFile of sourceFiles) {
  const classes = sourceFile.getClasses();
  
  for (const cls of classes) {
    const moduleDecorator = cls.getDecorator('Module');
    if (!moduleDecorator) continue;

    const callExpr = moduleDecorator.getCallExpression();
    if (!callExpr) continue;

    const args = callExpr.getArguments();
    if (args.length === 0) continue;

    const objExpr = args[0];
    if (!objExpr.isKind(SyntaxKind.ObjectLiteralExpression)) continue;

    const importsProp = objExpr.getProperty('imports');
    if (!importsProp || !importsProp.isKind(SyntaxKind.PropertyAssignment)) continue;

    const importsArray = importsProp.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);
    if (!importsArray) continue;

    const elements = importsArray.getElements();
    
    // Store module names, normalizing `SomeModule.forRoot()` to `SomeModule`
    const importedModules: string[] = [];
    
    for (const element of elements) {
      if (element.isKind(SyntaxKind.Identifier)) {
        importedModules.push(element.getText());
      } else if (element.isKind(SyntaxKind.CallExpression)) {
        const expression = element.getExpression();
        if (expression.isKind(SyntaxKind.PropertyAccessExpression)) {
          // e.g., ConfigModule.forRoot() -> ConfigModule
          importedModules.push(expression.getExpression().getText());
        } else {
          importedModules.push(element.getText());
        }
      }
    }

    // Find duplicates
    const seen = new Set<string>();
    const dupes = new Set<string>();
    
    for (const mod of importedModules) {
      if (seen.has(mod)) {
        dupes.add(mod);
      }
      seen.add(mod);
    }

    if (dupes.size > 0) {
      console.log(`[DUPLICATE] In file: ${sourceFile.getFilePath()}`);
      console.log(`Class ${cls.getName()} has duplicate imports: ${Array.from(dupes).join(', ')}\n`);
      totalDuplicates++;
    }
  }
}

if (totalDuplicates === 0) {
  console.log('No duplicate module imports found in metadata.');
} else {
  console.log(`Found duplicates in ${totalDuplicates} module/s.`);
  process.exit(1);
}
