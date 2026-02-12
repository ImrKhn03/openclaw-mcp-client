/**
 * MCP Client - Enhanced with graceful error handling
 * Built by Toki for OpenClaw
 */

const MCPHttpTransport = require('./http-transport');
const StdioTransport = require('./stdio-transport');

class MCPClient {
  constructor(serverConfig) {
    this.name = serverConfig.name;
    this.url = serverConfig.url;
    this.type = serverConfig.type || 'http';
    this.config = serverConfig;
    
    this.transport = null;
    this.tools = [];
    this.resources = [];
    this.prompts = [];
    this.initialized = false;
    this.authRequired = serverConfig.oauth?.required || false;
    this.connectionError = null;
  }

  /**
   * Initialize connection to MCP server
   */
  async connect() {
    if (this.initialized) {
      return true;
    }

    try {
      // Create transport based on type
      if (this.type === 'http') {
        this.transport = new MCPHttpTransport(this.url, {
          authToken: this.config.authToken,
          headers: this.config.headers || {}
        });
      } else if (this.type === 'stdio') {
        // STDIO transport for local MCP servers
        const command = this.config.command;
        const args = this.config.args || [];
        if (!command) {
          throw new Error('STDIO transport requires "command" in config');
        }
        this.transport = new StdioTransport(command, args, this.config.options);
        await this.transport.start();
      } else {
        throw new Error(`Unsupported transport type: ${this.type}`);
      }

      // Initialize MCP connection
      const initResponse = await this.transport.initialize();
      console.log(`[MCP] ✅ Connected to ${this.name}`);

      // Discover available tools, resources, prompts
      await this.discoverCapabilities();

      this.initialized = true;
      this.connectionError = null;
      return true;
    } catch (error) {
      this.connectionError = error.message;
      
      // If auth is required and we got 401, that's expected
      if (this.authRequired && (error.message.includes('401') || error.message.includes('auth'))) {
        console.log(`[MCP] ⚠️  ${this.name}: Authentication required (OAuth setup needed)`);
        return false;
      }
      
      // Other errors are more serious
      console.error(`[MCP] ❌ ${this.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Discover tools, resources, and prompts from the server
   */
  async discoverCapabilities() {
    try {
      // Fetch tools
      this.tools = await this.transport.listTools();
      console.log(`[MCP] 📦 ${this.name}: ${this.tools.length} tools discovered`);

      // Fetch resources (optional, may not be supported)
      try {
        this.resources = await this.transport.listResources();
        if (this.resources.length > 0) {
          console.log(`[MCP] 📚 ${this.name}: ${this.resources.length} resources`);
        }
      } catch (e) {
        this.resources = [];
      }

      // Fetch prompts (optional)
      try {
        this.prompts = await this.transport.listPrompts();
        if (this.prompts.length > 0) {
          console.log(`[MCP] 💬 ${this.name}: ${this.prompts.length} prompts`);
        }
      } catch (e) {
        this.prompts = [];
      }

      return {
        tools: this.tools,
        resources: this.resources,
        prompts: this.prompts
      };
    } catch (error) {
      throw new Error(`Capability discovery failed: ${error.message}`);
    }
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(toolName, args = {}) {
    if (!this.initialized) {
      if (this.authRequired && !this.config.authToken) {
        throw new Error(`${this.name} requires OAuth authentication. Please run OAuth setup first.`);
      }
      await this.connect();
    }

    try {
      const result = await this.transport.callTool(toolName, args);
      return result;
    } catch (error) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  /**
   * Get list of available tools
   */
  getTools() {
    return this.tools;
  }

  /**
   * Get a specific tool by name
   */
  getTool(name) {
    return this.tools.find(t => t.name === name);
  }

  /**
   * Check if server is ready (initialized or waiting for auth)
   */
  isReady() {
    return this.initialized || (this.authRequired && this.connectionError);
  }

  /**
   * Get connection status
   */
  getStatus() {
    if (this.initialized) {
      return { status: 'connected', tools: this.tools.length };
    }
    if (this.authRequired && this.connectionError) {
      return { status: 'auth_required', error: this.connectionError };
    }
    if (this.connectionError) {
      return { status: 'error', error: this.connectionError };
    }
    return { status: 'disconnected' };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token) {
    if (this.transport) {
      this.transport.setAuthToken(token);
    }
    this.config.authToken = token;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    this.initialized = false;
    this.transport = null;
  }
}

module.exports = MCPClient;
