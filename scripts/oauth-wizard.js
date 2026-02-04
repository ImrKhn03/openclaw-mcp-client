#!/usr/bin/env node
/**
 * Interactive OAuth Setup Wizard
 * Built by Toki 🦞
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SERVER_DIR = path.join(__dirname, '../servers');
const TOKEN_FILE = path.join(__dirname, '../.oauth-tokens.json');

// Colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function loadServers() {
  const files = fs.readdirSync(SERVER_DIR).filter(f => f.endsWith('.json'));
  return files
    .map(f => {
      try {
        const content = fs.readFileSync(path.join(SERVER_DIR, f), 'utf8');
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    })
    .filter(c => c && c.enabled !== false && c.oauth?.required);
}

async function loadTokens() {
  try {
    const data = fs.readFileSync(TOKEN_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

async function selectServer(servers, tokens) {
  console.log(`\n${c.bright}${c.cyan}📋 Available Servers (OAuth Required):${c.reset}\n`);
  
  servers.forEach((server, i) => {
    const hasToken = !!tokens[server.name];
    const status = hasToken ? `${c.green}✅ Authenticated${c.reset}` : `${c.red}❌ Not set up${c.reset}`;
    console.log(`  ${c.bright}${i + 1}.${c.reset} ${server.name.padEnd(20)} ${status}`);
    if (server.description) {
      console.log(`     ${c.gray}${server.description}${c.reset}`);
    }
  });
  
  console.log('');
  const answer = await question(`${c.cyan}Select server (1-${servers.length}) or 'q' to quit:${c.reset} `);
  
  if (answer.toLowerCase() === 'q') {
    return null;
  }
  
  const index = parseInt(answer) - 1;
  if (index >= 0 && index < servers.length) {
    return servers[index];
  }
  
  console.log(`${c.red}Invalid selection${c.reset}`);
  return null;
}

async function setupOAuth(server) {
  console.log(`\n${c.bright}${c.cyan}🔐 OAuth Setup for ${server.name}${c.reset}\n`);
  
  const oauth = server.oauth;
  
  // Check if we have client credentials in config
  if (!oauth.clientId || !oauth.clientSecret) {
    console.log(`${c.yellow}⚠️  This server requires OAuth credentials${c.reset}\n`);
    console.log('You need to provide:');
    console.log(`  ${c.bright}Client ID${c.reset}`);
    console.log(`  ${c.bright}Client Secret${c.reset}\n`);
    
    const hasCredentials = await question(`${c.cyan}Do you have these credentials? (y/n):${c.reset} `);
    
    if (hasCredentials.toLowerCase() !== 'y') {
      console.log(`\n${c.yellow}Please obtain OAuth credentials from ${server.name} and update servers/${server.name}.json${c.reset}`);
      return false;
    }
    
    // Get credentials
    const clientId = await question(`${c.cyan}Client ID:${c.reset} `);
    const clientSecret = await question(`${c.cyan}Client Secret:${c.reset} `);
    
    // Update server config
    server.oauth.clientId = clientId.trim();
    server.oauth.clientSecret = clientSecret.trim();
    
    // Save updated config
    const configPath = path.join(SERVER_DIR, `${server.name}.json`);
    fs.writeFileSync(configPath, JSON.stringify(server, null, 2));
    console.log(`${c.green}✅ Credentials saved${c.reset}`);
  }
  
  console.log(`\n${c.bright}OAuth Flow:${c.reset}`);
  console.log(`1. Authorization URL: ${c.blue}${oauth.authUrl}${c.reset}`);
  console.log(`2. Token URL: ${c.blue}${oauth.tokenUrl}${c.reset}`);
  console.log(`3. Scopes: ${c.blue}${oauth.scopes.join(', ')}${c.reset}\n`);
  
  console.log(`${c.yellow}Note: Full OAuth flow requires running the oauth script:${c.reset}`);
  console.log(`  ${c.bright}node scripts/oauth-manual.js ${server.name}${c.reset}\n`);
  
  const proceed = await question(`${c.cyan}Run OAuth setup now? (y/n):${c.reset} `);
  
  if (proceed.toLowerCase() === 'y') {
    console.log(`\n${c.gray}Launching OAuth flow...${c.reset}\n`);
    rl.close();
    
    // Run the manual OAuth script
    const { spawn } = require('child_process');
    const child = spawn('node', ['scripts/oauth-manual.js', server.name], {
      stdio: 'inherit'
    });
    
    child.on('exit', (code) => {
      process.exit(code);
    });
    
    return true;
  }
  
  return false;
}

async function main() {
  console.clear();
  console.log(`${c.bright}${c.cyan}`);
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🔐 OpenClaw MCP OAuth Wizard 🔐   ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(c.reset);
  console.log(`${c.gray}Built by Toki 🦞${c.reset}`);
  
  try {
    const servers = await loadServers();
    
    if (servers.length === 0) {
      console.log(`\n${c.yellow}No servers found that require OAuth${c.reset}`);
      rl.close();
      return;
    }
    
    const tokens = await loadTokens();
    const selected = await selectServer(servers, tokens);
    
    if (!selected) {
      console.log(`\n${c.gray}Cancelled${c.reset}`);
      rl.close();
      return;
    }
    
    await setupOAuth(selected);
    
    if (!rl.closed) {
      rl.close();
    }
    
  } catch (error) {
    console.error(`\n${c.red}Error: ${error.message}${c.reset}`);
    rl.close();
    process.exit(1);
  }
}

main();
