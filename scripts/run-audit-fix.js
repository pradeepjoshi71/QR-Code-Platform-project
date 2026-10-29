const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('Running npm audit fix (safe only)...');
  const fixOutput = execSync('npm audit fix', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  fs.writeFileSync('audit_fix_output.txt', fixOutput);
  console.log('npm audit fix completed successfully.');
} catch (err) {
  const output = (err.stdout || '') + (err.stderr || '') + (err.message || '');
  fs.writeFileSync('audit_fix_output.txt', output);
  console.log('npm audit fix finished with output/code.');
}

try {
  console.log('Running npm audit after fix...');
  const auditAfter = execSync('npm audit', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  fs.writeFileSync('audit_after.txt', auditAfter);
} catch (err) {
  const output = (err.stdout || '') + (err.stderr || '') + (err.message || '');
  fs.writeFileSync('audit_after.txt', output);
}

console.log('Audit scripts finished.');
