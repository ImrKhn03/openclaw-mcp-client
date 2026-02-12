/**
 * STDIO Transport for MCP Servers
 * Handles JSON-RPC over stdin/stdout
 * Built by Toki for OpenClaw
 */

const { spawn } = require('child_process');
const { EventEmitter } = require('events');

class StdioTransport extends EventEmitter {
  constructor(command, args = [], options = {}) {
    super();
    
    this.command = command;
    this.args = args || [];
    this.options = options;
    
    this.process = null;
    this.messageId = 0;
    this.pendingRequests = new Map();
    this.initialized = false;
  }

  /**
   * Start the MCP server process
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.process = spawn(this.command, this.args, {
          stdio: ['pipe', 'pipe', 'inherit'],
          ...this.options
        });

        let initData = '';

        // Handle stdout (responses from server)
        this.process.stdout.on('data', (data) => {
          initData += data.toString();
          this._processMessages(initData);
          initData = '';
        });

        // Handle stderr
        this.process.stderr.on('data', (data) => {
          console.error(`[STDIO] Server stderr: ${data}`);
        });

        // Handle process exit
        this.process.on('exit', (code, signal) => {
          this.initialized = false;
          this.emit('exit', { code, signal });
        });

        // Handle process error
        this.process.on('error', (error) => {
          this.initialized = false;
          reject(error);
        });

        this.initialized = true;
        resolve();
      } catch (error) {
        reject(new Error(`Failed to start STDIO process: ${error.message}`));
      }
    });
  }

  /**
   * Send a request to the MCP server
   */
  async request(method, params = {}) {
    if (!this.initialized || !this.process) {
      throw new Error('STDIO transport not initialized');
    }

    const id = ++this.messageId;
    const message = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout for ${method}`));
      }, 30000); // 30 second timeout

      this.pendingRequests.set(id, { resolve, reject, timeout });

      try {
        this.process.stdin.write(JSON.stringify(message) + '\n');
      } catch (error) {
        this.pendingRequests.delete(id);
        clearTimeout(timeout);
        reject(new Error(`Failed to send request: ${error.message}`));
      }
    });
  }

  /**
   * Process incoming messages from server
   */
  _processMessages(data) {
    const lines = data.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const message = JSON.parse(line);
        
        if (message.id) {
          const pending = this.pendingRequests.get(message.id);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingRequests.delete(message.id);

            if (message.error) {
              pending.reject(new Error(message.error.message || 'Unknown error'));
            } else {
              pending.resolve(message.result);
            }
          }
        } else if (message.method) {
          // Server-initiated notification
          this.emit('notification', message);
        }
      } catch (error) {
        console.error(`[STDIO] Failed to parse message: ${error.message}`);
      }
    }
  }

  /**
   * Initialize MCP session
   */
  async initialize() {
    const response = await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        sampling: {}
      },
      clientInfo: {
        name: 'openclaw-mcp-client',
        version: '1.1.0'
      }
    });

    return response;
  }

  /**
   * List available tools
   */
  async listTools() {
    const response = await this.request('tools/list');
    return response?.tools || [];
  }

  /**
   * Call a tool
   */
  async callTool(name, args) {
    const response = await this.request('tools/call', {
      name,
      arguments: args
    });

    return response;
  }

  /**
   * List available resources
   */
  async listResources() {
    const response = await this.request('resources/list');
    return response?.resources || [];
  }

  /**
   * Read a resource
   */
  async readResource(uri) {
    const response = await this.request('resources/read', { uri });
    return response;
  }

  /**
   * List available prompts
   */
  async listPrompts() {
    const response = await this.request('prompts/list');
    return response?.prompts || [];
  }

  /**
   * Close the connection
   */
  async close() {
    if (this.process) {
      return new Promise((resolve) => {
        this.process.on('exit', resolve);
        this.process.stdin.end();
      });
    }
  }
}

module.exports = StdioTransport;
