import * as fs from 'fs';
import * as path from 'path';

function checkDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    console.error(`\x1b[31m[BNES Upstream Sync Error]\x1b[0m Directory missing: ${dirPath}`);
    console.error(`This likely happened during an upstream merge. Please restore the BearNetwork custom modules.`);
    process.exit(1);
  }
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  
  const bnesPqcPath = path.join(rootDir, 'shared', 'bnes-pqc');
  const bnsPath = path.join(rootDir, 'shared', 'bns');

  console.log(`Checking BNES custom modules...`);
  
  checkDirectoryExists(bnesPqcPath);
  checkDirectoryExists(bnsPath);
  
  console.log(`\x1b[32m[BNES Upstream Sync OK]\x1b[0m All custom modules are intact.`);
}

main();
