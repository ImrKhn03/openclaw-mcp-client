#!/usr/bin/env node
/**
 * OAuth Status Checker
 * Shows which MCP servers are authenticated
 * Built by Toki 🦞
 */

const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '../.oauth-tokens.json');
const SERVER_DIR = path.join(__dirname, '../servers');

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

async function checkStatus() {
  console.log('🔐 OAuth Status Report\n');

  // Load tokens
  let tokens = {};
  try {
    const tokenData = fs.readFileSync(TOKEN_FILE, 'utf8');
    tokens = JSON.parse(tokenData);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error(`${colors.red}Error reading tokens: ${e.message}${colors.reset}`);
    }
  }

  // Load server configs
  let servers = [];
  try {
    const files = fs.readdirSync(SERVER_DIR);
    servers = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const content = fs.readFileSync(path.join(SERVER_DIR, f), 'utf8');
          return JSON.parse(content);
        } catch (e) {
          console.error(`${colors.yellow}Warning: Failed to parse ${f}${colors.reset}`);
          return null;
        }
      })
      .filter(c => c !== null && c.enabled !== false);
  } catch (e) {
    console.error(`${colors.red}Error reading servers directory: ${e.message}${colors.reset}`);
    process.exit(1);
  }

  if (servers.length === 0) {
    console.log(`${colors.yellow}No enabled servers found in ${SERVER_DIR}${colors.reset}`);
    process.exit(0);
  }

  // Check each server
  let authenticatedCount = 0;
  let needsAuthCount = 0;
  let noAuthCount = 0;

  console.log('Server                 Status              Action');
  console.log('─────────────────────  ──────────────────  ──────────────────────────');

  for (const server of servers) {
    const hasToken = !!tokens[server.name];
    const needsAuth = server.oauth?.required === true;

    let status, statusColor, action;

    if (hasToken) {
      status = '✅ Authenticated';
      statusColor = colors.green;
      action = '';
      authenticatedCount++;
    } else if (needsAuth) {
      status = '❌ Needs OAuth';
      statusColor = colors.red;
      action = `npm run oauth ${server.name}`;
      needsAuthCount++;
    } else {
      status = '⚪ No auth needed';
      statusColor = colors.gray;
      action = '';
      noAuthCount++;
    }

    const name = (server.name || 'unknown').padEnd(21);
    const statusText = status.padEnd(18);
    
    console.log(`${name} ${statusColor}${statusText}${colors.reset}  ${colors.blue}${action}${colors.reset}`);
    
    // Show token expiry if available
    if (hasToken && tokens[server.name].expires_at) {
      const expiresAt = new Date(tokens[server.name].expires_at * 1000);
      const now = new Date();
      const daysLeft = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 7) {
        console.log(`                       ${colors.yellow}⚠️  Expires in ${daysLeft} days${colors.reset}`);
      }
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`${colors.green}✅ ${authenticatedCount} authenticated${colors.reset}  |  ${colors.red}❌ ${needsAuthCount} need setup${colors.reset}  |  ${colors.gray}⚪ ${noAuthCount} no auth${colors.reset}`);
  console.log('═══════════════════════════════════════════════════════════════════');

  if (needsAuthCount > 0) {
    console.log('');
    console.log(`${colors.yellow}To set up OAuth, run:${colors.reset}`);
    console.log(`  ${colors.blue}npm run oauth <server-name>${colors.reset}`);
  }

  console.log('');
}

checkStatus().catch(err => {
  console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
  process.exit(1);
});
