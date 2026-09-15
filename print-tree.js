const fs = require('fs');
const path = require('path');

// Các thư mục mặc định cần bỏ qua
const DEFAULT_IGNORE = [
  'node_modules',
  '.git',
  '.turbo',
  '.next',
  'dist',
  'build',
  '.vscode',
  '.idea'
];

function generateTree(dir, prefix = '', ignoreList = DEFAULT_IGNORE, currentDepth = 1, maxDepth = Infinity) {
  if (currentDepth > maxDepth) return '';
  let result = '';
  const basename = path.basename(dir);
  
  // Lấy danh sách file/thư mục con
  let items = [];
  try {
    items = fs.readdirSync(dir);
  } catch (err) {
    return `${prefix}└── [Error reading directory]\n`;
  }

  // Lọc bỏ các thư mục/file ẩn hoặc nằm trong danh sách ignore
  items = items.filter(item => {
    return !ignoreList.includes(item) && !item.startsWith('.');
  });

  // Sắp xếp: Thư mục trước, file sau, theo bảng chữ cái
  items.sort((a, b) => {
    const aPath = path.join(dir, a);
    const bPath = path.join(dir, b);
    const aIsDir = fs.statSync(aPath).isDirectory();
    const bIsDir = fs.statSync(bPath).isDirectory();

    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  items.forEach((item, index) => {
    const itemPath = path.join(dir, item);
    const isLast = index === items.length - 1;
    const marker = isLast ? '└── ' : '├── ';
    const isDir = fs.statSync(itemPath).isDirectory();

    result += `${prefix}${marker}${item}${isDir ? '/' : ''}\n`;

    if (isDir) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      result += generateTree(itemPath, nextPrefix, ignoreList, currentDepth + 1, maxDepth);
    }
  });

  return result;
}

// Chạy script
const targetDir = process.argv[2] || '.';
const maxDepthInput = process.argv[3] ? parseInt(process.argv[3], 10) : Infinity;
const absoluteTargetDir = path.resolve(targetDir);
const folderName = path.basename(absoluteTargetDir);

console.log(`${folderName}/`);
console.log(generateTree(absoluteTargetDir, '', DEFAULT_IGNORE, 1, maxDepthInput));

