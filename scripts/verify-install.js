#!/usr/bin/env node
/**
 * Installation Verification Script
 * Checks if everything is set up correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 OpenClaw MCP Client - Installation Verification\n');

let errors = 0;
let warnings = 0;

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 18) {
  console.log('❌ Node.js version too old:', nodeVersion);
  console.log('   Required: >= 18.0.0');
  errors++;
} else {
  console.log('✅ Node.js version:', nodeVersion);
}

// Check required files
const requiredFiles = [
  'index.js',
  'lib/http-transport.js',
  'lib/mcp-client.js',
  'lib/mcp-manager.js',
  'lib/oauth.js',
  'package.json'
];

console.log('\n📁 Checking required files...');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  if (exists) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing!`);
    errors++;
  }
});

// Check server configs
console.log('\n🔌 Checking server configurations...');
const serversDir = path.join(__dirname, '..', 'servers');
if (fs.existsSync(serversDir)) {
  const configs = fs.readdirSync(serversDir).filter(f => f.endsWith('.json'));
  console.log(`✅ Found ${configs.length} server configs:`);
  configs.forEach(config => {
    console.log(`   - ${config}`);
  });
  if (configs.length === 0) {
    console.log('⚠️  No server configs found - add some in servers/');
    warnings++;
  }
} else {
  console.log('❌ servers/ directory not found');
  errors++;
}

// Check dependencies
console.log('\n📦 Checking dependencies...');
const nodeModules = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModules)) {
  console.log('✅ node_modules exists');
  
  const packageJson = require('../package.json');
  const deps = packageJson.dependencies || {};
  
  Object.keys(deps).forEach(dep => {
    const depPath = path.join(nodeModules, dep);
    if (fs.existsSync(depPath)) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - Not installed`);
      errors++;
    }
  });
} else {
  console.log('❌ node_modules not found - run: npm install');
  errors++;
}

// Check examples
console.log('\n📚 Checking examples...');
const examplesDir = path.join(__dirname, '..', 'examples');
if (fs.existsSync(examplesDir)) {
  const examples = fs.readdirSync(examplesDir).filter(f => f.endsWith('.js'));
  console.log(`✅ Found ${examples.length} examples`);
  examples.forEach(ex => {
    console.log(`   - ${ex}`);
  });
} else {
  console.log('⚠️  examples/ directory not found');
  warnings++;
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log('📊 Installation Summary');
console.log('═'.repeat(60));

if (errors === 0 && warnings === 0) {
  console.log('✅ Everything looks good! Ready to use.');
  console.log('\n💡 Try running:');
  console.log('   node index.js           - List all MCP servers');
  console.log('   npm run list-tools      - List available tools');
  console.log('   npm run order-food      - Try food ordering example');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(s) found - fix these first`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning(s) - optional but recommended`);
  }
  
  if (errors > 0) {
    console.log('\n💡 To fix:');
    console.log('   1. Run: npm install');
    console.log('   2. Ensure all files are present');
    console.log('   3. Add server configs to servers/');
  }
}

console.log('');

process.exit(errors > 0 ? 1 : 0);
