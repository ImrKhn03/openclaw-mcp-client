#!/usr/bin/env node

/**
 * Manual OAuth Token Input
 * Paste the full callback URL with the code
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Swiggy MCP Manual OAuth Setup\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 STEP 1: Get Authorization Code');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// PKCE helpers
function base64URLEncode(str) {
  return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}

// Generate PKCE parameters
const codeVerifier = base64URLEncode(crypto.randomBytes(32));
const codeChallenge = base64URLEncode(sha256(codeVerifier));

const CLIENT_ID = 'swiggy-mcp';
const AUTH_URL = 'https://mcp.swiggy.com/auth/authorize';
const TOKEN_URL = 'https://mcp.swiggy.com/auth/token';
const SCOPES = 'mcp:tools mcp:resources mcp:prompts';
const REDIRECT_URI = 'http://127.0.0.1:3000/';
const state = base64URLEncode(crypto.randomBytes(16));

// Build authorization URL
const authParams = new URLSearchParams({
  client_id: CLIENT_ID,
  response_type: 'code',
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  scope: SCOPES,
  redirect_uri: REDIRECT_URI,
  state: state
});

const authUrl = `${AUTH_URL}?${authParams.toString()}`;

console.log('Open this URL in your browser:\n');
console.log(authUrl);
console.log();
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 STEP 2: Copy the Callback URL');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('After logging in, you\'ll be redirected to a URL like:');
console.log('http://127.0.0.1:3000/?code=LONG_CODE_HERE&state=...');
console.log();
console.log('Copy the ENTIRE URL and paste it below.\n');

rl.question('Paste the callback URL here: ', async (callbackUrl) => {
  try {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    
    if (!code) {
      console.error('\n❌ No authorization code found in URL');
      process.exit(1);
    }
    
    console.log('\n✅ Authorization code received!');
    console.log('🔄 Exchanging for access token...\n');
    
    const fetch = (await import('node-fetch')).default;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier
    });
    
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
      console.error('❌ Token exchange failed:', responseText);
      process.exit(1);
    }
    
    const tokens = JSON.parse(responseText);
    
    console.log('✅ Access token received!');
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ OAuth Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 You can now use Swiggy MCP servers!');
    console.log('   Try: npm run shop-groceries\n');
    
    rl.close();
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    rl.close();
    process.exit(1);
  }
});
