/**
 * MCP HTTP Transport Layer - Using node-fetch
 * Built by Toki for OpenClaw
 */

class MCPHttpTransport {
  constructor(serverUrl, options = {}) {
    this.serverUrl = serverUrl;
    this.timeout = options.timeout || 30000;
    this.headers = options.headers || {};
    this.authToken = options.authToken || null;
    this.fetch = null;
  }

  async ensureFetch() {
    if (!this.fetch) {
      this.fetch = (await import('node-fetch')).default;
    }
    return this.fetch;
  }

  async request(endpoint, method = 'POST', data = {}) {
    const fetch = await this.ensureFetch();
    const url = `${this.serverUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      ...this.headers
    };

    if (this.authToken) {
      const authHeader = this.authToken.startsWith('Bearer ') 
        ? this.authToken 
        : `Bearer ${this.authToken}`;
      headers['Authorization'] = authHeader;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(data) : undefined
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      return JSON.parse(responseText);
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    const response = await this.request('', 'POST', request);

    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message || JSON.stringify(response.error)}`);
    }

    return response.result;
  }

  async initialize() {
    return await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'openclaw-mcp-client',
        version: '1.0.0'
      }
    });
  }

  async listTools() {
    const result = await this.sendRequest('tools/list');
    return result.tools || [];
  }

  async listResources() {
    try {
      const result = await this.sendRequest('resources/list');
      return result.resources || [];
    } catch (error) {
      return [];
    }
  }

  async listPrompts() {
    try {
      const result = await this.sendRequest('prompts/list');
      return result.prompts || [];
    } catch (error) {
      return [];
    }
  }

  async callTool(toolName, args) {
    return await this.sendRequest('tools/call', {
      name: toolName,
      arguments: args
    });
  }

  disconnect() {
    // No persistent connection to close
  }
}

module.exports = MCPHttpTransport;
