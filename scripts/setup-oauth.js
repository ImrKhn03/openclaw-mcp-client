#!/usr/bin/env node
/**
 * OAuth Setup Helper
 * Helps you configure OAuth for MCP servers
 * 
 * Usage: node scripts/setup-oauth.js <server-name>
 */

const OpenClawMCPClient = require('../index');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function setupOAuth() {
  const serverName = process.argv[2];
  
  if (!serverName) {
    console.log('Usage: node scripts/setup-oauth.js <server-name>');
    console.log('\nAvailable servers:');
    console.log('  - swiggy-food');
    console.log('  - swiggy-instamart');
    console.log('  - zomato');
    process.exit(1);
  }

  console.log(`\n🔐 OAuth Setup for ${serverName}\n`);

  const clientId = await question('Client ID: ');
  const clientSecret = await question('Client Secret: ');
  
  console.log('\n📋 OAuth Configuration:');
  console.log(`   Server: ${serverName}`);
  console.log(`   Client ID: ${clientId.substring(0, 10)}...`);
  console.log('');

  const client = new OpenClawMCPClient();
  await client.initialize();

  // Get server config to determine OAuth URLs
  const serverClient = client.manager.getClient(serverName);
  if (!serverClient) {
    console.error(`❌ Server not found: ${serverName}`);
    console.log('\nMake sure the server is configured in servers/ directory');
    process.exit(1);
  }

  const config = serverClient.config;
  if (!config.oauth || !config.oauth.required) {
    console.log(`ℹ️  ${serverName} doesn't require OAuth`);
    process.exit(0);
  }

  try {
    await client.setupOAuth(serverName, {
      clientId: clientId,
      clientSecret: clientSecret,
      authUrl: config.oauth.authUrl,
      tokenUrl: config.oauth.tokenUrl,
      scopes: config.oauth.scopes || []
    });

    console.log('\n✅ OAuth setup complete!');
    console.log('\n💡 The access token has been set. You can now use the server!');
    console.log('\nNote: Token is stored in memory only. For persistent storage,');
    console.log('      save it to a secure location (e.g., ~/.openclaw/tokens.json)');
    
  } catch (error) {
    console.error(`\n❌ OAuth setup failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
    client.shutdown();
  }
}

if (require.main === module) {
  setupOAuth().catch(console.error);
}

module.exports = setupOAuth;
