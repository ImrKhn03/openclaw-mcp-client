# API Documentation

Complete API reference for OpenClaw MCP Client.

## Table of Contents

- [OpenClawMCPClient](#openclawmcpclient)
- [MCPManager](#mcpmanager)
- [MCPClient](#mcpclient)
- [OAuthHandler](#oauthhandler)
- [HTTPTransport](#httptransport)

---

## OpenClawMCPClient

Main entry point for the MCP client.

### Constructor

```javascript
const client = new OpenClawMCPClient(options);
```

**Options:**
- `configDir` (string): Path to server configs directory. Default: `'./servers'`

### Methods

#### `initialize()`

Initialize and connect to all configured MCP servers.

```javascript
await client.initialize();
```

**Returns:** `Promise<Object>`
- `connected` (number): Number of successfully connected servers
- `authRequired` (number): Number of servers waiting for OAuth
- `failed` (number): Number of failed servers

**Example:**
```javascript
const stats = await client.initialize();
console.log(`Connected: ${stats.connected}`);
```

---

#### `getTools()`

Get list of all available tools across all servers.

```javascript
const tools = client.getTools();
```

**Returns:** `Array<Tool>`

**Tool Object:**
```javascript
{
  key: 'server-name:tool-name',
  server: 'server-name',
  name: 'tool-name',
  description: 'Tool description',
  inputSchema: { ... }
}
```

**Example:**
```javascript
const tools = client.getTools();
tools.forEach(tool => {
  console.log(`${tool.server}:${tool.name}`);
});
```

---

#### `searchTools(query)`

Search for tools by name or description.

```javascript
const tools = client.searchTools('restaurant');
```

**Parameters:**
- `query` (string): Search term

**Returns:** `Array<Tool>`

**Example:**
```javascript
const foodTools = client.searchTools('food');
console.log(`Found ${foodTools.length} food-related tools`);
```

---

#### `callTool(serverName, toolName, args)`

Call a tool on an MCP server.

```javascript
const result = await client.callTool('swiggy-food', 'search_restaurants', {
  location: { lat: 12.93, lng: 77.62 },
  query: 'biryani'
});
```

**Parameters:**
- `serverName` (string): Name of the MCP server
- `toolName` (string): Name of the tool to call
- `args` (Object): Tool arguments

**Returns:** `Promise<any>` - Tool result

**Throws:** Error if server not found or tool execution fails

---

#### `getServerStatuses()`

Get connection status of all servers.

```javascript
const statuses = client.getServerStatuses();
```

**Returns:** `Object<string, Status>`

**Status Object:**
```javascript
{
  status: 'connected' | 'auth_required' | 'error' | 'disconnected',
  tools?: number,
  error?: string
}
```

**Example:**
```javascript
const statuses = client.getServerStatuses();
Object.entries(statuses).forEach(([name, status]) => {
  console.log(`${name}: ${status.status}`);
});
```

---

#### `setupOAuth(serverName, oauthConfig)`

Set up OAuth authentication for a server.

```javascript
await client.setupOAuth('swiggy-food', {
  clientId: 'your_client_id',
  clientSecret: 'your_secret',
  authUrl: 'https://auth.example.com/authorize',
  tokenUrl: 'https://auth.example.com/token',
  scopes: ['read', 'write']
});
```

**Parameters:**
- `serverName` (string): Server to authenticate
- `oauthConfig` (Object): OAuth configuration
  - `clientId` (string): OAuth client ID
  - `clientSecret` (string): OAuth client secret
  - `authUrl` (string): Authorization endpoint
  - `tokenUrl` (string): Token endpoint
  - `scopes` (Array<string>): OAuth scopes

**Returns:** `Promise<Object>` - Token response

**Side Effects:**
- Opens browser for authorization
- Starts local callback server on port 3000
- Sets token on the MCP client

---

#### `shutdown()`

Disconnect from all servers and clean up.

```javascript
client.shutdown();
```

---

## MCPManager

Internal server manager (exposed via `client.manager`).

### Methods

#### `loadConfigs()`

Load all server configurations from the configs directory.

```javascript
await manager.loadConfigs();
```

---

#### `addServer(config)`

Add a new MCP server.

```javascript
await manager.addServer({
  name: 'my-server',
  type: 'http',
  url: 'https://mcp.example.com',
  enabled: true
});
```

---

#### `getClient(serverName)`

Get an MCP client instance for a specific server.

```javascript
const serverClient = manager.getClient('swiggy-food');
```

---

#### `callTool(serverName, toolName, args)`

Call a tool on a specific server.

```javascript
const result = await manager.callTool('server', 'tool', args);
```

---

## MCPClient

Individual MCP server client.

### Constructor

```javascript
const mcpClient = new MCPClient(serverConfig);
```

### Methods

#### `connect()`

Connect to the MCP server.

```javascript
await mcpClient.connect();
```

---

#### `callTool(toolName, args)`

Call a tool on this server.

```javascript
const result = await mcpClient.callTool('search', { query: 'pizza' });
```

---

#### `getTools()`

Get tools available on this server.

```javascript
const tools = mcpClient.getTools();
```

---

#### `getTool(name)`

Get a specific tool by name.

```javascript
const tool = mcpClient.getTool('search_restaurants');
```

---

#### `getStatus()`

Get connection status.

```javascript
const status = mcpClient.getStatus();
// { status: 'connected', tools: 10 }
```

---

#### `setAuthToken(token)`

Set authentication token.

```javascript
mcpClient.setAuthToken('access_token_here');
```

---

#### `disconnect()`

Disconnect from server.

```javascript
mcpClient.disconnect();
```

---

## OAuthHandler

OAuth 2.0 authentication handler.

### Constructor

```javascript
const oauth = new OAuthHandler({
  clientId: 'client_id',
  clientSecret: 'client_secret',
  authUrl: 'https://auth.example.com/authorize',
  tokenUrl: 'https://auth.example.com/token',
  scopes: ['read', 'write']
});
```

### Methods

#### `getAuthorizationUrl(state)`

Generate OAuth authorization URL.

```javascript
const url = oauth.getAuthorizationUrl('random_state');
```

---

#### `exchangeCodeForToken(code)`

Exchange authorization code for access token.

```javascript
const tokens = await oauth.exchangeCodeForToken('auth_code');
```

---

#### `refreshToken()`

Refresh the access token using refresh token.

```javascript
const newTokens = await oauth.refreshToken();
```

---

#### `getAccessToken()`

Get current access token.

```javascript
const token = oauth.getAccessToken();
```

---

#### `getValidToken()`

Get valid access token (refreshes if needed).

```javascript
const token = await oauth.getValidToken();
```

---

#### `startCallbackServer(port)`

Start local OAuth callback server.

```javascript
const tokens = await oauth.startCallbackServer(3000);
```

---

## HTTPTransport

HTTP transport layer for MCP protocol.

### Constructor

```javascript
const transport = new MCPHttpTransport(url, options);
```

**Parameters:**
- `url` (string): MCP server URL
- `options` (Object):
  - `authToken` (string): Bearer token
  - `headers` (Object): Custom headers

### Methods

#### `initialize()`

Initialize MCP connection.

```javascript
const response = await transport.initialize();
```

---

#### `listTools()`

List available tools.

```javascript
const tools = await transport.listTools();
```

---

#### `callTool(name, args)`

Execute a tool.

```javascript
const result = await transport.callTool('tool-name', { arg: 'value' });
```

---

#### `setAuthToken(token)`

Set authentication token.

```javascript
transport.setAuthToken('new_token');
```

---

## Error Handling

All async methods can throw errors. Always use try-catch:

```javascript
try {
  const result = await client.callTool('server', 'tool', args);
} catch (error) {
  if (error.message.includes('auth')) {
    // Handle authentication error
  } else if (error.message.includes('404')) {
    // Handle not found
  } else {
    // Handle other errors
  }
}
```

## Common Errors

- `"MCP server not found"` - Server name is incorrect
- `"OAuth authentication required"` - Need to set up OAuth
- `"Tool execution failed"` - Tool call error (check args)
- `"Failed to connect"` - Network or server issue

---

## TypeScript Support

TypeScript definitions coming soon! For now, use JSDoc:

```javascript
/**
 * @typedef {Object} Tool
 * @property {string} key
 * @property {string} server
 * @property {string} name
 * @property {string} description
 * @property {Object} inputSchema
 */
```

---

**For more examples, see the [examples/](../examples/) directory.**
