# OpenClaw MCP Client

```
   ___                   _____ _                  __  __  _____ _____  
  / _ \ _ __   ___ _ __ / ____| |                |  \/  |/ ____|  __ \ 
 | | | | '_ \ / _ \ '_ | |    | | __ ___      __ | \  / | |    | |__) |
 | |_| | |_) |  __/ | || |____| |/ _` \ \ /\ / / | |\/| | |    |  ___/ 
  \___/| .__/ \___|_| | \_____|_|\__,_|\ V  V /  |_|  |_|\___|_|     
       | |                               \_/\_/                        
       |_|                                                             
```

> **🦞 Built by Toki** - Connect OpenClaw to ANY MCP server!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built by](https://img.shields.io/badge/Built%20by-Toki-blue)](https://github.com/ImrKhn03/openclaw-mcp-client)

Connect your OpenClaw assistant to the entire MCP (Model Context Protocol) ecosystem - Swiggy, Zomato, GitHub, Slack, databases, and hundreds more services!

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get started in 5 minutes ⚡
- **[Usage Guide](USAGE.md)** - Complete usage documentation 📖
- **[API Documentation](API.md)** - Full API reference 🔧
- **[Development Guide](DEVELOPMENT.md)** - Contributing & extending 💻
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues & solutions 🔍
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute 🤝
- **[Changelog](CHANGELOG.md)** - Version history 📋
- **[Testing Notes](TESTING_NOTES.md)** - HTTP vs STDIO findings 🧪

## 🚀 What is This?

This is a **universal MCP client** for OpenClaw that lets you:
- 🍛 Order food from Swiggy and Zomato
- 🛒 Get groceries via Swiggy Instamart
- 🍽️ Book restaurant tables with Swiggy Dineout
- 🔌 Connect to ANY MCP server (GitHub, Slack, databases, APIs, etc.)
- 🤖 Use natural language to interact with all these services

## ✨ Features

- ✅ **HTTP MCP Protocol** - Full implementation of MCP 2024-11-05
- ✅ **OAuth 2.0 Support** - Secure authentication for services that need it
- ✅ **Multi-Server Management** - Connect to unlimited MCP servers simultaneously
- ✅ **Dynamic Tool Discovery** - Automatically find and register all available tools
- ✅ **Graceful Error Handling** - Works even when some servers need auth
- ✅ **Easy Configuration** - Just drop JSON files in `servers/` directory
- ✅ **OpenClaw Integration** - Seamless skill integration with natural language

## 📦 Installation

```bash
# Clone into your OpenClaw skills directory
cd ~/.openclaw/workspace/skills
git clone https://github.com/ImrKhn03/openclaw-mcp-client.git
cd openclaw-mcp-client

# Install dependencies
npm install

# Test it
node index.js
```

## 🎯 Quick Start

### 1. Test the Installation

```bash
node index.js
```

You should see:
```
🦞 OpenClaw MCP Client v1.0.0
   Built by Toki

[MCP Manager] Loading 3 server configs...
...
✨ Initialization complete!
```

### 2. View Available Tools

```bash
node examples/list-tools.js
```

### 3. Try an Example (requires OAuth)

```bash
node examples/order-food.js
```

## 🔧 Configuration

### Pre-configured Servers

Three servers are ready out of the box:

- **Swiggy Food** (`servers/swiggy-food.json`) - Food ordering
- **Swiggy Instamart** (`servers/swiggy-instamart.json`) - Grocery delivery
- **Zomato** (`servers/zomato.json`) - Food ordering and discovery

### Adding New Servers

Create a JSON file in `servers/`:

```json
{
  "name": "my-server",
  "type": "http",
  "url": "https://mcp.example.com",
  "enabled": true,
  "description": "My custom MCP server",
  "oauth": {
    "required": false
  }
}
```

**With OAuth:**
```json
{
  "name": "github",
  "type": "http",
  "url": "https://mcp.github.com",
  "enabled": true,
  "oauth": {
    "required": true,
    "clientId": "your_client_id",
    "clientSecret": "your_client_secret",
    "authUrl": "https://github.com/login/oauth/authorize",
    "tokenUrl": "https://github.com/login/oauth/access_token",
    "scopes": ["repo", "user"]
  }
}
```

Restart OpenClaw - the new server is automatically discovered!

## 🔐 OAuth Setup

For servers that require authentication (Swiggy, Zomato):

```javascript
const OpenClawMCPClient = require('./index');

const client = new OpenClawMCPClient();
await client.initialize();

// Setup OAuth for Swiggy Food
await client.setupOAuth('swiggy-food', {
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  authUrl: 'https://mcp.swiggy.com/food/oauth/authorize',
  tokenUrl: 'https://mcp.swiggy.com/food/oauth/token',
  scopes: ['food.read', 'food.order']
});
```

The skill will:
1. Print an authorization URL
2. Open a local callback server
3. Wait for you to authorize in browser
4. Automatically save the access token
5. Reconnect with authentication

## 📚 Usage Examples

### Search Restaurants (Swiggy)

```javascript
const result = await client.callTool('swiggy-food', 'search_restaurants', {
  location: { lat: 12.9351929, lng: 77.62448069999999 },
  query: 'biryani'
});
```

### Browse Menu

```javascript
const menu = await client.callTool('swiggy-food', 'get_menu', {
  restaurantId: '12345',
  location: { lat: 12.9351929, lng: 77.62448069999999 }
});
```

### Grocery Search (Instamart)

```javascript
const products = await client.callTool('swiggy-instamart', 'search_products', {
  location: { lat: 12.9351929, lng: 77.62448069999999 },
  query: 'milk'
});
```

See `examples/` directory for complete working examples!

## 🤖 OpenClaw Integration

Once installed as a skill, use natural language:

```
"Order biryani from Swiggy"
→ Searches restaurants, shows menu, helps order

"Find Italian restaurants near me on Zomato"
→ Uses Zomato MCP to search

"Add milk to my Instamart cart"
→ Uses Swiggy Instamart MCP
```

The skill automatically:
- Detects which MCP server to use
- Handles authentication if needed
- Calls the appropriate tools
- Formats results naturally
- Completes the requested action

## 📊 Project Structure

```
openclaw-mcp-client/
├── lib/
│   ├── http-transport.js    # HTTP MCP protocol implementation
│   ├── mcp-client.js         # Single server client
│   ├── mcp-manager.js        # Multi-server manager
│   └── oauth.js              # OAuth 2.0 handler
├── servers/
│   ├── swiggy-food.json      # Swiggy Food config
│   ├── swiggy-instamart.json # Instamart config
│   └── zomato.json           # Zomato config
├── examples/
│   ├── list-tools.js         # List all available tools
│   └── order-food.js         # Food ordering example
├── index.js                  # Main entry point
├── SKILL.md                  # OpenClaw skill definition
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🧪 Testing

```bash
# List all tools from all servers
node examples/list-tools.js

# Test food ordering (requires OAuth)
node examples/order-food.js

# Run main CLI
node index.js
```

## 🛠️ Development

### Adding Features

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Running Tests

```bash
npm test
```

(Tests coming soon!)

## 📖 Technical Details

### MCP Protocol Support

- **Version**: MCP 2024-11-05
- **Transports**: HTTP (stdio and SSE planned)
- **Features**: Tools, Resources, Prompts
- **Authentication**: OAuth 2.0

### HTTP Transport

The HTTP transport layer implements the MCP protocol over HTTPS/HTTP:
- JSON-RPC style requests
- Proper error handling
- Token-based authentication
- Timeout management

### Multi-Server Architecture

The manager can handle unlimited concurrent MCP servers:
- Each server runs independently
- Shared tool registry
- Centralized error handling
- Graceful degradation (servers can fail without breaking others)

## 🤝 Contributing

Built by **Toki** for @ImrKhn03 and the OpenClaw community!

Contributions welcome:
- 🐛 Bug reports
- ✨ Feature requests
- 📝 Documentation improvements
- 🧪 Tests
- 🔌 New MCP server configs

## 📜 License

MIT License - See [LICENSE](LICENSE) file

Copyright (c) 2026 Toki (OpenClaw Assistant) & Imran Khan

## 🔗 Links

- **GitHub**: https://github.com/ImrKhn03/openclaw-mcp-client
- **ClawdHub**: (Publishing soon!)
- **MCP Specification**: https://spec.modelcontextprotocol.io/
- **OpenClaw**: https://github.com/openclaw/openclaw
- **Swiggy MCP**: https://github.com/Swiggy/swiggy-mcp-server-manifest
- **Zomato MCP**: https://github.com/Zomato/mcp-server-manifest

## 💬 Support

- Open an issue on GitHub
- Check the examples directory
- Read SKILL.md for OpenClaw integration details

## 🙏 Acknowledgments

- Built with ❤️ by **Toki** (OpenClaw Assistant)
- Created for **Imran Khan** (@ImrKhn03)
- Inspired by the growing MCP ecosystem
- Thanks to Swiggy and Zomato for providing MCP servers

---

**Status**: ✅ Fully functional (OAuth setup required for some servers)  
**Version**: 1.0.0  
**Last Updated**: Feb 3, 2026  
**Built by**: Toki 🦞

*Making OpenClaw even more powerful, one MCP server at a time!*
