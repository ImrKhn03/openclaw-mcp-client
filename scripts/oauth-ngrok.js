#!/usr/bin/env node

/**
 * Swiggy MCP OAuth with PKCE + ngrok tunnel
 * Works from anywhere - creates a public URL for OAuth callback
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ngrok = require('ngrok');

console.log('🔐 Swiggy MCP OAuth Setup (with ngrok tunnel)\n');

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

// OAuth configuration
const CLIENT_ID = 'swiggy-mcp';
const AUTH_URL = 'https://mcp.swiggy.com/auth/authorize';
const TOKEN_URL = 'https://mcp.swiggy.com/auth/token';
const SCOPES = 'mcp:tools mcp:resources mcp:prompts';
const PORT = 3000;

let publicUrl = null;

async function exchangeCodeForToken(code) {
  const fetch = (await import('node-fetch')).default;
  
  const redirectUri = publicUrl || `http://localhost:${PORT}/`;
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier
  });
  
  console.log('\n📤 Token request:');
  console.log('   Code verifier:', codeVerifier.substring(0, 20) + '...');
  console.log('   Redirect URI:', redirectUri);
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
    console.error('❌ Token endpoint error:', responseText);
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
  
  const tokenData = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: tokens.token_type || 'Bearer',
    expires_at: Date.now() + ((tokens.expires_in || 3600) * 1000),
    created_at: Date.now(),
    scope: tokens.scope || SCOPES
  };
  
  existingTokens['swiggy-instamart'] = tokenData;
  existingTokens['swiggy-food'] = { ...tokenData };
  existingTokens['swiggy-dineout'] = { ...tokenData };
  
  fs.writeFileSync(tokenFile, JSON.stringify(existingTokens, null, 2));
  console.log('💾 Tokens saved to:', tokenFile);
  console.log('   ✅ swiggy-instamart');
  console.log('   ✅ swiggy-food');
  console.log('   ✅ swiggy-dineout');
  console.log();
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/?')) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    if (error) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>OAuth Failed</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Authentication Failed</h1>
            <p>Error: ${error}</p>
            <p>${url.searchParams.get('error_description') || ''}</p>
            <p>You can close this window and try again.</p>
          </body>
        </html>
      `);
      console.log('\n❌ Authentication failed:', error);
      await cleanup();
      process.exit(1);
    }
    
    if (code) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>OAuth Success</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>✅ Authorization Successful!</h1>
            <p>Exchanging code for access token...</p>
            <p style="color: #666;">You can close this window.</p>
          </body>
        </html>
      `);
      
      console.log('✅ Received authorization code!');
      console.log('🔄 Exchanging code for access token...');
      
      try {
        await exchangeCodeForToken(code);
        console.log('✅ OAuth setup complete!');
        console.log('\n💡 You can now use Swiggy MCP servers!');
        console.log('   Try: npm run shop-groceries\n');
        await cleanup();
        process.exit(0);
      } catch (err) {
        console.error('❌ Token exchange failed:', err.message);
        await cleanup();
        process.exit(1);
      }
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function cleanup() {
  if (publicUrl) {
    console.log('🔌 Closing ngrok tunnel...');
    await ngrok.kill();
  }
  server.close();
}

async function startServer() {
  // Start HTTP server
  await new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`🌐 Local server listening on port ${PORT}`);
      resolve();
    });
  });
  
  // Start ngrok tunnel
  console.log('🚇 Creating ngrok tunnel...');
  publicUrl = await ngrok.connect(PORT);
  console.log('✅ Public URL:', publicUrl);
  console.log();
  
  console.log('🔑 PKCE Parameters:');
  console.log('   Code Verifier:', codeVerifier.substring(0, 20) + '...');
  console.log('   Code Challenge:', codeChallenge.substring(0, 20) + '...');
  console.log();
  
  // Build authorization URL
  const authParams = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: SCOPES,
    redirect_uri: publicUrl + '/',
    state: base64URLEncode(crypto.randomBytes(16))
  });
  
  const authUrl = `${AUTH_URL}?${authParams.toString()}`;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 OPEN THIS URL IN YOUR BROWSER:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log();
  console.log(authUrl);
  console.log();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log();
  console.log('📝 Steps:');
  console.log('   1. Log in with your Swiggy account');
  console.log('   2. Authorize the MCP client');
  console.log('   3. You\'ll be redirected back automatically');
  console.log();
  console.log('⏳ Waiting for authorization...\n');
}

// Handle Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\n❌ OAuth setup cancelled');
  await cleanup();
  process.exit(0);
});

// Start!
startServer().catch(async (err) => {
  console.error('❌ Failed to start server:', err.message);
  await cleanup();
  process.exit(1);
});
