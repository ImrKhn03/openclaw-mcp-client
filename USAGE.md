# Usage Guide

Complete guide to using the OpenClaw MCP Client.

## Table of Contents

1. [Installation](#installation)
2. [Basic Usage](#basic-usage)
3. [Server Configuration](#server-configuration)
4. [OAuth Setup](#oauth-setup)
5. [Programmatic Usage](#programmatic-usage)
6. [OpenClaw Integration](#openclaw-integration)
7. [Advanced Features](#advanced-features)

---

## Installation

### From GitHub

```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/ImrKhn03/openclaw-mcp-client.git
cd openclaw-mcp-client
npm install
```

### Verify Installation

```bash
npm run verify
```

You should see all green checkmarks ✅

---

## Basic Usage

### List All Servers

```bash
npm start
```

Shows status of all configured MCP servers.

### List Available Tools

```bash
npm run list-tools
```

Shows all tools from connected servers.

### Run Examples

```bash
# Food ordering (requires OAuth)
npm run order-food

# Grocery shopping (requires OAuth)
npm run shop-groceries

# Restaurant discovery (requires OAuth)
npm run discover-restaurants
```

---

## Server Configuration

### Adding a New Server

Create a JSON file in `servers/` directory:

**Simple Server (No Auth):**
```json
{
  "name": "my-server",
  "type": "http",
  "url": "https://mcp.example.com",
  "enabled": true,
  "description": "My MCP server"
}
```

**Server with OAuth:**
```json
{
  "name": "my-server",
  "type": "http",
  "url": "https://mcp.example.com",
  "enabled": true,
  "description": "My MCP server",
  "oauth": {
    "required": true,
    "clientId": "your_client_id",
    "clientSecret": "your_client_secret",
    "authUrl": "https://auth.example.com/authorize",
    "tokenUrl": "https://auth.example.com/token",
    "scopes": ["read", "write"]
  }
}
```

**Server with Custom Headers:**
```json
{
  "name": "my-server",
  "type": "http",
  "url": "https://mcp.example.com",
  "enabled": true,
  "headers": {
    "X-Custom-Header": "value",
    "X-API-Version": "1.0"
  }
}
```

### Disabling a Server

Set `"enabled": false` in the config file.

---

## OAuth Setup

### Interactive Setup

```bash
npm run setup-oauth swiggy-food
```

Follow the prompts:
1. Enter Client ID
2. Enter Client Secret
3. Browser opens for authorization
4. Approve the application
5. Token is automatically saved

### Manual Setup

```javascript
const OpenClawMCPClient = require('openclaw-mcp-client');

const client = new OpenClawMCPClient();
await client.initialize();

await client.setupOAuth('server-name', {
  clientId: 'your_id',
  clientSecret: 'your_secret',
  authUrl: 'https://auth.example.com/authorize',
  tokenUrl: 'https://auth.example.com/token',
  scopes: ['read', 'write']
});
```

### Getting OAuth Credentials

**Swiggy:**
1. Go to [Swiggy Developer Console](https://developer.swiggy.com)
2. Create a new application
3. Copy Client ID and Secret
4. Add redirect URI: `http://localhost:3000/oauth/callback`

**Zomato:**
1. Visit [Zomato Developer Portal](https://developers.zomato.com)
2. Register your application
3. Get API credentials
4. Configure callback URL

---

## Programmatic Usage

### Initialize Client

```javascript
const OpenClawMCPClient = require('openclaw-mcp-client');

const client = new OpenClawMCPClient({
  configDir: './servers'  // Optional, defaults to './servers'
});

await client.initialize();
```

### Search for Tools

```javascript
// Get all tools
const allTools = client.getTools();

// Search by keyword
const foodTools = client.searchTools('restaurant');
const dbTools = client.searchTools('database');
```

### Call a Tool

```javascript
const result = await client.callTool('swiggy-food', 'search_restaurants', {
  location: {
    lat: 12.9351929,
    lng: 77.62448069999999
  },
  query: 'biryani',
  filters: {
    sortBy: 'RATING',
    maxResults: 10
  }
});

console.log(result);
```

### Check Server Status

```javascript
const statuses = client.getServerStatuses();

for (const [name, status] of Object.entries(statuses)) {
  console.log(`${name}: ${status.status}`);
  if (status.tools) {
    console.log(`  Tools: ${status.tools}`);
  }
}
```

### Error Handling

```javascript
try {
  const result = await client.callTool('server', 'tool', args);
} catch (error) {
  if (error.message.includes('auth')) {
    console.log('Authentication required');
    await client.setupOAuth('server', config);
  } else if (error.message.includes('not found')) {
    console.log('Server or tool not found');
  } else {
    console.error('Error:', error.message);
  }
}
```

### Cleanup

```javascript
// Always shutdown when done
client.shutdown();
```

---

## OpenClaw Integration

### Natural Language Commands

Once installed as an OpenClaw skill:

```
"Order biryani from Swiggy"
"Find pizza restaurants near me on Zomato"
"Add milk and bread to my Instamart cart"
"Search for iPhone on Swiggy Instamart"
```

### Skill Behavior

The skill automatically:
1. Detects intent (food ordering, grocery shopping, etc.)
2. Selects appropriate MCP server
3. Calls relevant tools
4. Formats results naturally
5. Handles authentication if needed

### Checking Skill Status

In OpenClaw:
```
"What MCP servers are available?"
"List all MCP tools"
"Check MCP server status"
```

---

## Advanced Features

### Custom Transport Options

```javascript
const client = new OpenClawMCPClient();
await client.initialize();

// Get raw MCP client for advanced operations
const mcpClient = client.manager.getClient('server-name');

// Set custom timeout
mcpClient.transport.timeout = 30000;

// Add custom headers
mcpClient.transport.headers['X-Custom'] = 'value';
```

### Batch Tool Calls

```javascript
const promises = [
  client.callTool('swiggy-food', 'search_restaurants', args1),
  client.callTool('zomato', 'discover_restaurants', args2),
  client.callTool('swiggy-instamart', 'search_products', args3)
];

const results = await Promise.all(promises);
```

### Server Management

```javascript
// Add server dynamically
await client.manager.addServer({
  name: 'new-server',
  type: 'http',
  url: 'https://mcp.example.com',
  enabled: true
});

// Get specific client
const serverClient = client.manager.getClient('swiggy-food');

// Call tool directly on client
const result = await serverClient.callTool('search_restaurants', args);
```

### Token Management

```javascript
const oauth = client.oauthHandlers.get('server-name');

// Check if token is expired
if (oauth.isTokenExpired()) {
  // Refresh automatically
  await oauth.refreshToken();
}

// Get current token
const token = oauth.getAccessToken();

// Set token manually
client.manager.getClient('server').setAuthToken('new_token');
```

---

## Common Patterns

### Restaurant Search

```javascript
async function searchRestaurants(query, location) {
  try {
    const result = await client.callTool('swiggy-food', 'search_restaurants', {
      location: location,
      query: query,
      filters: { sortBy: 'RATING' }
    });
    
    return result.restaurants.map(r => ({
      name: r.name,
      rating: r.rating,
      cuisines: r.cuisines,
      deliveryTime: r.deliveryTime
    }));
  } catch (error) {
    console.error('Search failed:', error.message);
    return [];
  }
}
```

### Grocery Shopping

```javascript
async function buildGroceryCart(items, location) {
  const cart = [];
  
  for (const item of items) {
    const result = await client.callTool('swiggy-instamart', 'search_products', {
      location: location,
      query: item
    });
    
    if (result.products && result.products.length > 0) {
      const product = result.products[0];
      cart.push({
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }
  }
  
  return cart;
}
```

### Menu Browsing

```javascript
async function getMenu(restaurantId, location) {
  const result = await client.callTool('swiggy-food', 'get_menu', {
    restaurantId: restaurantId,
    location: location
  });
  
  // Group by category
  const categories = {};
  result.menu.forEach(item => {
    const cat = item.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  });
  
  return categories;
}
```

---

## Tips & Best Practices

### Performance

- Cache server connections - don't reinitialize repeatedly
- Use batch calls when possible
- Set appropriate timeouts
- Handle errors gracefully

### Security

- Never commit OAuth tokens to git
- Store credentials in environment variables
- Use `.gitignore` for sensitive configs
- Rotate tokens regularly

### Debugging

- Check server status with `npm start`
- Use `npm run verify` for installation issues
- Read error messages carefully
- Check TROUBLESHOOTING.md

### Development

- Test with one server first
- Use examples as templates
- Add comprehensive error handling
- Document custom integrations

---

## Next Steps

- Read [API Documentation](API.md) for detailed API reference
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Browse [examples/](examples/) for more code samples
- Join community discussions on GitHub

---

**Need help? Open an issue on GitHub!**

https://github.com/ImrKhn03/openclaw-mcp-client/issues
