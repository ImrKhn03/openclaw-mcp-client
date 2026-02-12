#!/usr/bin/env node

/**
 * Swiggy MCP OAuth with PKCE (Proof Key for Code Exchange)
 * Based on actual VSCode MCP flow
 */

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Swiggy MCP OAuth Setup (PKCE Flow)\n');

// PKCE helpers
function base64URLEncode(str) {
  return str
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}

// Generate PKCE parameters
const codeVerifier = base64URLEncode(crypto.randomBytes(32));
const codeChallenge = base64URLEncode(sha256(codeVerifier));

console.log('🔑 PKCE Parameters Generated');
console.log('   Code Verifier:', codeVerifier.substring(0, 20) + '...');
console.log('   Code Challenge:', codeChallenge.substring(0, 20) + '...\n');

// OAuth configuration (from VSCode flow)
const CLIENT_ID = 'swiggy-mcp';
const AUTH_URL = 'https://mcp.swiggy.com/auth/authorize';
const TOKEN_URL = 'https://mcp.swiggy.com/auth/token';
const SCOPES = 'mcp:tools mcp:resources mcp:prompts';
const PORT = 3000;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/`;

console.log('📋 OAuth Configuration:');
console.log('   Client ID:', CLIENT_ID);
console.log('   Auth URL:', AUTH_URL);
console.log('   Redirect URI:', REDIRECT_URI);
console.log('   Scopes:', SCOPES);
console.log('\n⏳ Starting OAuth flow...\n');

// Create HTTP server to catch callback
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/?')) {
    const url = new URL(req.url, REDIRECT_URI);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    
    if (error) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Authentication Failed</h1>
            <p>Error: ${error}</p>
            <p>${url.searchParams.get('error_description') || ''}</p>
            <p>You can close this window and try again.</p>
          </body>
        </html>
      `);
      console.log('\n❌ Authentication failed:', error);
      server.close();
      process.exit(1);
    }
    
    if (code) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>✅ Authorization Successful!</h1>
            <p>Exchanging code for access token...</p>
            <p>You can close this window.</p>
          </body>
        </html>
      `);
      
      console.log('✅ Received authorization code!');
      console.log('🔄 Exchanging code for access token...\n');
      
      try {
        await exchangeCodeForToken(code);
        console.log('✅ OAuth setup complete!');
        console.log('\n💡 You can now use Swiggy MCP servers!');
        console.log('   Try: npm run shop-groceries\n');
        server.close();
        process.exit(0);
      } catch (err) {
        console.error('❌ Token exchange failed:', err.message);
        server.close();
        process.exit(1);
      }
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function exchangeCodeForToken(code) {
  const fetch = (await import('node-fetch')).default;
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier
  });
  
  console.log('📤 Token request parameters:');
  console.log('   Grant type: authorization_code');
  console.log('   Code verifier: ' + codeVerifier.substring(0, 20) + '...');
  console.log('   Redirect URI:', REDIRECT_URI);
  console.log();
  
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  });
  
  const responseText = await response.text();
  
  if (!response.ok) {
    console.error('❌ Token endpoint response:', responseText);
    throw new Error(`HTTP ${response.status}: ${responseText}`);
  }
  
  const tokens = JSON.parse(responseText);
  
  console.log('✅ Received access token!');
  console.log('   Token type:', tokens.token_type || 'Bearer');
  if (tokens.expires_in) {
    console.log('   Expires in:', tokens.expires_in, 'seconds');
  }
  console.log();
  
  // Save tokens
  const tokenFile = path.join(__dirname, '..', '.oauth-tokens.json');
  
  const existingTokens = fs.existsSync(tokenFile) 
    ? JSON.parse(fs.readFileSync(tokenFile, 'utf8'))
    : {};
  
  existingTokens['swiggy-instamart'] = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: tokens.token_type || 'Bearer',
    expires_at: Date.now() + ((tokens.expires_in || 3600) * 1000),
    created_at: Date.now(),
    scope: tokens.scope || SCOPES
  };
  
  // Also save for swiggy-food and swiggy-dineout (same auth)
  existingTokens['swiggy-food'] = { ...existingTokens['swiggy-instamart'] };
  existingTokens['swiggy-dineout'] = { ...existingTokens['swiggy-instamart'] };
  
  fs.writeFileSync(tokenFile, JSON.stringify(existingTokens, null, 2));
  console.log('💾 Tokens saved to:', tokenFile);
  console.log('   ✅ swiggy-instamart');
  console.log('   ✅ swiggy-food');
  console.log('   ✅ swiggy-dineout');
  console.log();
}

server.listen(PORT, () => {
  console.log(`🌐 OAuth callback server listening on port ${PORT}\n`);
  
  // Build authorization URL
  const authParams = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state: base64URLEncode(crypto.randomBytes(16))
  });
  
  const authUrl = `${AUTH_URL}?${authParams.toString()}`;
  
  console.log('👉 Opening browser for Swiggy login...');
  console.log('   If browser doesn\'t open, visit this URL:');
  console.log(`   ${authUrl}\n`);
  
  // Try to open browser
  const start = process.platform === 'darwin' ? 'open' : 
                process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${start} "${authUrl}"`);
  
  console.log('📝 Steps:');
  console.log('   1. Log in with your Swiggy account');
  console.log('   2. Authorize the MCP client');
  console.log('   3. You\'ll be redirected back here\n');
  console.log('⏳ Waiting for authorization...\n');
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n❌ OAuth setup cancelled');
  server.close();
  process.exit(0);
});
