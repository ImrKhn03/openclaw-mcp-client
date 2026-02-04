#!/usr/bin/env node

/**
 * Interactive OAuth setup for Swiggy Instamart
 * This will open a browser and guide you through authentication
 */

const http = require('http');
const { exec } = require('child_process');

console.log('🔐 Swiggy Instamart OAuth Setup\n');

// Swiggy's OAuth flow happens at the MCP level
// We need to guide the user to authenticate via browser

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const AUTH_URL = `https://mcp.swiggy.com/im/oauth/authorize`;

console.log('📋 Setup Steps:');
console.log('1. A browser will open with Swiggy login');
console.log('2. Log in with your Swiggy account');
console.log('3. Authorize the MCP client');
console.log('4. You\'ll be redirected back here\n');

// Create a simple HTTP server to catch the OAuth callback
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/callback')) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    if (error) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Authentication Failed</h1>
            <p>Error: ${error}</p>
            <p>You can close this window and try again.</p>
          </body>
        </html>
      `);
      console.log('\n❌ Authentication failed:', error);
      process.exit(1);
    }
    
    if (code) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>✅ Authentication Successful!</h1>
            <p>You can close this window and return to the terminal.</p>
          </body>
        </html>
      `);
      
      console.log('\n✅ Received authorization code!');
      console.log('🔄 Exchanging code for access token...\n');
      
      // Exchange code for token
      exchangeCodeForToken(code).then(() => {
        console.log('✅ OAuth setup complete!');
        console.log('\n💡 You can now use Swiggy Instamart in your MCP client');
        server.close();
        process.exit(0);
      }).catch(err => {
        console.error('❌ Token exchange failed:', err.message);
        server.close();
        process.exit(1);
      });
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function exchangeCodeForToken(code) {
  const fetch = (await import('node-fetch')).default;
  
  const response = await fetch('https://mcp.swiggy.com/im/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }
  
  const tokens = await response.json();
  
  // Save tokens
  const fs = require('fs');
  const path = require('path');
  const tokenFile = path.join(__dirname, '..', '.oauth-tokens.json');
  
  const existingTokens = fs.existsSync(tokenFile) 
    ? JSON.parse(fs.readFileSync(tokenFile, 'utf8'))
    : {};
  
  existingTokens['swiggy-instamart'] = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + (tokens.expires_in * 1000),
    created_at: Date.now()
  };
  
  fs.writeFileSync(tokenFile, JSON.stringify(existingTokens, null, 2));
  console.log('💾 Tokens saved to:', tokenFile);
}

server.listen(PORT, () => {
  console.log(`🌐 OAuth server listening on port ${PORT}\n`);
  
  const authUrl = `${AUTH_URL}?redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
  
  console.log('👉 Opening browser...');
  console.log('   If it doesn\'t open automatically, visit:');
  console.log(`   ${authUrl}\n`);
  
  // Try to open browser
  const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${start} "${authUrl}"`);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n❌ OAuth setup cancelled');
  server.close();
  process.exit(0);
});
