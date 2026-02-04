/**
 * MCP Manager - Enhanced with graceful error handling
 * Built by Toki for OpenClaw
 */

const fs = require('fs').promises;
const path = require('path');
const MCPClient = require('./mcp-client');

class MCPManager {
  constructor(configDir) {
    this.configDir = configDir || path.join(__dirname, '../servers');
    this.clients = new Map();
    this.tools = new Map();
    this.errors = [];
    this.tokens = {};
  }

  /**
   * Load OAuth tokens from file
   */
  async loadTokens() {
    try {
      const tokenPath = path.join(__dirname, '../.oauth-tokens.json');
      const tokenData = await fs.readFile(tokenPath, 'utf8');
      this.tokens = JSON.parse(tokenData);
      console.log(`[MCP Manager] 🔑 Loaded tokens for ${Object.keys(this.tokens).length} servers`);
    } catch (error) {
      // Token file doesn't exist yet - that's okay
      if (error.code !== 'ENOENT') {
        console.warn(`[MCP Manager] ⚠️  Failed to load tokens: ${error.message}`);
      }
    }
  }

  /**
   * Load all MCP server configurations
   */
  async loadConfigs() {
    try {
      // Load OAuth tokens first
      await this.loadTokens();
      
      const files = await fs.readdir(this.configDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      console.log(`[MCP Manager] Loading ${jsonFiles.length} server configs...\n`);

      for (const file of jsonFiles) {
        const configPath = path.join(this.configDir, file);
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);

        // Inject OAuth token if available
        if (this.tokens[config.name]) {
          const tokenData = this.tokens[config.name];
          config.authToken = `${tokenData.token_type || 'Bearer'} ${tokenData.access_token}`;
        }

        if (config.enabled !== false) {
          try {
            await this.addServer(config);
          } catch (error) {
            // Log but continue with other servers
            this.errors.push({ server: config.name, error: error.message });
          }
        } else {
          console.log(`[MCP Manager] ⏭️  Skipping disabled server: ${config.name}`);
        }
      }

      const connectedCount = this.clients.size;
      const authRequiredCount = this.errors.filter(e => 
        e.error.includes('auth') || e.error.includes('401')
      ).length;

      console.log(`\n[MCP Manager] ✅ ${connectedCount} servers connected`);
      if (authRequiredCount > 0) {
        console.log(`[MCP Manager] 🔐 ${authRequiredCount} servers need OAuth setup`);
      }
      if (this.errors.length > authRequiredCount) {
        console.log(`[MCP Manager] ❌ ${this.errors.length - authRequiredCount} servers failed to connect`);
      }

      return {
        connected: connectedCount,
        authRequired: authRequiredCount,
        failed: this.errors.length - authRequiredCount
      };
    } catch (error) {
      console.error(`[MCP Manager] Failed to load configs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add a new MCP server
   */
  async addServer(config) {
    const client = new MCPClient(config);
    
    try {
      await client.connect();
    } catch (error) {
      // If it's an auth error and auth is required, that's okay
      if (client.authRequired && client.connectionError) {
        // Store the client anyway so we can set auth later
        this.clients.set(config.name, client);
        throw error; // Will be caught and logged above
      }
      throw error;
    }

    this.clients.set(config.name, client);

    // Register all tools from this server
    const tools = client.getTools();
    for (const tool of tools) {
      const toolKey = `${config.name}:${tool.name}`;
      this.tools.set(toolKey, {
        server: config.name,
        tool: tool,
        client: client
      });
    }

    return client;
  }

  /**
   * Get a specific MCP client
   */
  getClient(serverName) {
    return this.clients.get(serverName);
  }

  /**
   * Call a tool on any registered server
   */
  async callTool(serverName, toolName, args = {}) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not found: ${serverName}`);
    }

    return await client.callTool(toolName, args);
  }

  /**
   * Get all available tools across all servers
   */
  getAllTools() {
    const allTools = [];
    for (const [key, toolInfo] of this.tools.entries()) {
      allTools.push({
        key: key,
        server: toolInfo.server,
        name: toolInfo.tool.name,
        description: toolInfo.tool.description,
        inputSchema: toolInfo.tool.inputSchema
      });
    }
    return allTools;
  }

  /**
   * Search for tools by name or description
   */
  searchTools(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllTools().filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      (t.description && t.description.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get status of all servers
   */
  getServerStatuses() {
    const statuses = {};
    for (const [name, client] of this.clients.entries()) {
      statuses[name] = client.getStatus();
    }
    return statuses;
  }

  /**
   * Disconnect all servers
   */
  disconnectAll() {
    for (const client of this.clients.values()) {
      client.disconnect();
    }
    this.clients.clear();
    this.tools.clear();
  }
}

module.exports = MCPManager;
