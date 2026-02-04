#!/usr/bin/env node
/**
 * Pre-Install Environment Checker
 * Validates environment before installation
 * Built by Toki 🦞
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

// Colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

const checks = [];
let hasErrors = false;

function log(message, type = 'info') {
  const symbols = {
    success: `${c.green}✅${c.reset}`,
    error: `${c.red}❌${c.reset}`,
    warning: `${c.yellow}⚠️ ${c.reset}`,
    info: `${c.blue}ℹ️ ${c.reset}`
  };
  console.log(`${symbols[type]} ${message}`);
}

async function checkNodeVersion() {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const major = parseInt(version.slice(1).split('.')[0]);
    
    if (major >= 18) {
      log(`Node.js ${version} ${c.gray}(requirement: >= 18)${c.reset}`, 'success');
      checks.push({ name: 'Node.js version', status: 'pass', value: version });
    } else {
      log(`Node.js ${version} is too old (need >= 18)`, 'error');
      checks.push({ name: 'Node.js version', status: 'fail', value: version });
      hasErrors = true;
    }
  } catch (error) {
    log('Node.js not found', 'error');
    checks.push({ name: 'Node.js', status: 'fail', value: 'not found' });
    hasErrors = true;
  }
}

async function checkNpm() {
  try {
    const { stdout } = await execAsync('npm --version');
    const version = stdout.trim();
    log(`npm ${version}`, 'success');
    checks.push({ name: 'npm', status: 'pass', value: version });
  } catch (error) {
    log('npm not found', 'error');
    checks.push({ name: 'npm', status: 'fail', value: 'not found' });
    hasErrors = true;
  }
}

async function checkGit() {
  try {
    const { stdout } = await execAsync('git --version');
    const version = stdout.trim();
    log(`${version}`, 'success');
    checks.push({ name: 'git', status: 'pass', value: version });
  } catch (error) {
    log('git not found (optional, but recommended)', 'warning');
    checks.push({ name: 'git', status: 'warning', value: 'not found' });
  }
}

async function checkDiskSpace() {
  try {
    const stats = await fs.statfs(process.cwd());
    const availableGB = (stats.bavail * stats.bsize) / (1024 ** 3);
    
    if (availableGB >= 1) {
      log(`${availableGB.toFixed(1)} GB available`, 'success');
      checks.push({ name: 'Disk space', status: 'pass', value: `${availableGB.toFixed(1)} GB` });
    } else {
      log(`Only ${availableGB.toFixed(1)} GB available (recommended: >= 1 GB)`, 'warning');
      checks.push({ name: 'Disk space', status: 'warning', value: `${availableGB.toFixed(1)} GB` });
    }
  } catch (error) {
    log('Could not check disk space', 'warning');
    checks.push({ name: 'Disk space', status: 'warning', value: 'unknown' });
  }
}

async function checkWritePermissions() {
  try {
    const testFile = path.join(process.cwd(), '.write-test');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    log('Write permissions OK', 'success');
    checks.push({ name: 'Write permissions', status: 'pass', value: 'yes' });
  } catch (error) {
    log('Cannot write to current directory', 'error');
    checks.push({ name: 'Write permissions', status: 'fail', value: 'no' });
    hasErrors = true;
  }
}

async function checkNetwork() {
  try {
    const https = require('https');
    await new Promise((resolve, reject) => {
      https.get('https://registry.npmjs.org', (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      }).on('error', reject);
    });
    log('Network connectivity OK', 'success');
    checks.push({ name: 'Network', status: 'pass', value: 'connected' });
  } catch (error) {
    log('Cannot reach npm registry', 'error');
    checks.push({ name: 'Network', status: 'fail', value: 'no connection' });
    hasErrors = true;
  }
}

async function checkPackageJson() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    await fs.access(packagePath);
    const content = await fs.readFile(packagePath, 'utf8');
    const pkg = JSON.parse(content);
    
    if (pkg.name === 'openclaw-mcp-client') {
      log('package.json found and valid', 'success');
      checks.push({ name: 'package.json', status: 'pass', value: `v${pkg.version}` });
    } else {
      log('package.json exists but may not be correct project', 'warning');
      checks.push({ name: 'package.json', status: 'warning', value: pkg.name });
    }
  } catch (error) {
    log('package.json not found or invalid', 'error');
    checks.push({ name: 'package.json', status: 'fail', value: 'missing/invalid' });
    hasErrors = true;
  }
}

async function checkSystem() {
  const platform = os.platform();
  const arch = os.arch();
  const memory = (os.totalmem() / (1024 ** 3)).toFixed(1);
  
  log(`${platform} (${arch}), ${memory} GB RAM`, 'info');
  checks.push({ name: 'System', status: 'info', value: `${platform} ${arch} ${memory}GB` });
}

async function runChecks() {
  console.log(`${c.bright}${c.blue}`);
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   🔍 Pre-Installation Environment Check 🔍 ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(c.reset);
  console.log(`${c.gray}Built by Toki 🦞${c.reset}\n`);

  await checkSystem();
  console.log('');
  
  console.log(`${c.bright}Required:${c.reset}`);
  await checkNodeVersion();
  await checkNpm();
  await checkWritePermissions();
  await checkNetwork();
  await checkPackageJson();
  
  console.log('');
  console.log(`${c.bright}Optional:${c.reset}`);
  await checkGit();
  await checkDiskSpace();
  
  console.log('');
  console.log('═'.repeat(50));
  
  if (hasErrors) {
    console.log(`${c.red}${c.bright}❌ Pre-installation checks failed${c.reset}`);
    console.log('');
    console.log('Please fix the errors above before installing.');
    process.exit(1);
  } else {
    const warnings = checks.filter(c => c.status === 'warning').length;
    console.log(`${c.green}${c.bright}✅ Environment OK!${c.reset}`);
    if (warnings > 0) {
      console.log(`${c.yellow}${warnings} warning(s) - installation may work but could have issues${c.reset}`);
    }
    console.log('');
    console.log(`${c.bright}Ready to install!${c.reset}`);
    console.log(`Run: ${c.blue}./install.sh${c.reset}`);
  }
  
  console.log('');
}

runChecks().catch(err => {
  console.error(`${c.red}Error during checks: ${err.message}${c.reset}`);
  process.exit(1);
});
