/**
 * OpenClaw MCP Client - Main Entry Point
 * Built by Toki for OpenClaw
 * Version: 1.0.0
 */

const MCPManager = require('./lib/mcp-manager');
const OAuthHandler = require('./lib/oauth');
const path = require('path');

class OpenClawMCPClient {
  constructor(options = {}) {
    this.configDir = options.configDir || path.join(__dirname, 'servers');
    this.manager = new MCPManager(this.configDir);
    this.oauthHandlers = new Map();
    this.version = '1.0.0';
  }

  /**
   * Initialize and connect to all configured MCP servers
   */
  async initialize() {
    console.log('🦞 OpenClaw MCP Client v' + this.version);
    console.log('   Built by Toki\n');
    
    const result = await this.manager.loadConfigs();
    
    console.log('\n✨ Initialization complete!\n');
    return result;
  }

  /**
   * Get list of all available tools
   */
  getTools() {
    return this.manager.getAllTools();
  }

  /**
   * Search for tools
   */
  searchTools(query) {
    return this.manager.searchTools(query);
  }

  /**
   * Call a tool
   */
  async callTool(serverName, toolName, args = {}) {
    return await this.manager.callTool(serverName, toolName, args);
  }

  /**
   * Get server statuses
   */
  getServerStatuses() {
    return this.manager.getServerStatuses();
  }

  /**
   * Setup OAuth for a server
   */
  async setupOAuth(serverName, oauthConfig) {
    const handler = new OAuthHandler(oauthConfig);
    this.oauthHandlers.set(serverName, handler);

    // Start callback server and get auth URL
    const authUrl = handler.getAuthorizationUrl();
    console.log(`\n🔐 OAuth Setup for ${serverName}`);
    console.log('═'.repeat(60));
    console.log('\n1. Open this URL in your browser:');
    console.log(`   ${authUrl}\n`);
    console.log('2. Authorize the application');
    console.log('3. Wait for the callback...\n');
    console.log('Starting callback server on http://localhost:3000\n');

    // Start callback server
    const tokens = await handler.startCallbackServer();
    
    // Set token on the MCP client
    const client = this.manager.getClient(serverName);
    if (client) {
      client.setAuthToken(tokens.access_token);
      await client.connect(); // Reconnect with auth
    }

    console.log(`\n✅ ${serverName} authorized successfully!\n`);
    return tokens;
  }

  /**
   * Shutdown all connections
   */
  shutdown() {
    this.manager.disconnectAll();
    console.log('\n👋 OpenClaw MCP Client shutdown complete\n');
  }
}

// Export both the class and a singleton instance
module.exports = OpenClawMCPClient;
module.exports.default = OpenClawMCPClient;

// CLI usage
if (require.main === module) {
  (async () => {
    const client = new OpenClawMCPClient();
    const stats = await client.initialize();

    // Show server statuses
    const statuses = client.getServerStatuses();
    console.log('📊 Server Status:');
    console.log('═'.repeat(60));
    for (const [name, status] of Object.entries(statuses)) {
      const icon = status.status === 'connected' ? '✅' : 
                   status.status === 'auth_required' ? '🔐' : '❌';
      console.log(`${icon} ${name}: ${status.status}`);
      if (status.tools) {
        console.log(`   └─ ${status.tools} tools available`);
      }
      if (status.error && status.status !== 'auth_required') {
        console.log(`   └─ Error: ${status.error}`);
      }
    }

    // Show available tools
    const tools = client.getTools();
    if (tools.length > 0) {
      console.log('\n\n📦 Available Tools:');
      console.log('═'.repeat(60));
      tools.forEach(tool => {
        console.log(`  • ${tool.server}:${tool.name}`);
        if (tool.description) {
          console.log(`    ${tool.description}`);
        }
      });
    }

    console.log('\n\n📈 Summary:');
    console.log('═'.repeat(60));
    console.log(`  Connected servers: ${stats.connected}`);
    console.log(`  Servers need auth: ${stats.authRequired || 0}`);
    console.log(`  Failed servers:    ${stats.failed || 0}`);
    console.log(`  Total tools:       ${tools.length}`);
    
    if (stats.authRequired > 0) {
      console.log('\n💡 Tip: Run OAuth setup for servers that need authentication:');
      console.log('   const client = new OpenClawMCPClient();');
      console.log('   await client.setupOAuth("swiggy-food", {...config});');
    }

    console.log('');
    client.shutdown();
  })();
}
