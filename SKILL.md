---
name: mcp-client
description: Connect OpenClaw to any MCP (Model Context Protocol) server - Swiggy, Zomato, GitHub, and hundreds more!
version: 1.0.0
author: Toki (OpenClaw Assistant)
---

# MCP Client Skill

Connect OpenClaw to the entire MCP ecosystem!

## What This Skill Does

This skill enables OpenClaw to communicate with **any** HTTP-based MCP (Model Context Protocol) server, giving you instant access to:

- 🍛 **Swiggy** - Food ordering, groceries (Instamart), table booking (Dineout)
- 🍕 **Zomato** - Restaurant discovery and food ordering
- 💻 **GitHub** - Code, issues, PRs (when configured)
- 💬 **Slack** - Team communication (when configured)
- 🗄️ **Databases** - PostgreSQL, MySQL, MongoDB (when configured)
- 🔌 **And hundreds more MCP servers!**

## Installation

```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/ImrKhn03/openclaw-mcp-client.git
cd openclaw-mcp-client
npm install
```

## Configuration

### Add MCP Servers

Create JSON config files in the `servers/` directory:

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

**Pre-configured servers:**
- ✅ Swiggy Food (`swiggy-food.json`)
- ✅ Swiggy Instamart (`swiggy-instamart.json`)
- ✅ Zomato (`zomato.json`)

### OAuth Setup (For Swiggy/Zomato)

When a server requires OAuth, the skill will:
1. Print an authorization URL
2. Start a local callback server
3. Wait for you to authorize in your browser
4. Automatically save the token

## Usage

Once installed, the skill automatically registers all MCP tools as OpenClaw commands!

### Natural Language Examples

```
"Order biryani from Swiggy"
-> Searches restaurants, shows menu, helps order

"Find Italian restaurants near me on Zomato"
-> Uses Zomato MCP to search

"Add milk to my Instamart cart"
-> Uses Swiggy Instamart MCP

"What tools are available?"
-> Lists all registered MCP tools
```

### Programmatic Usage

```javascript
const MCPClient = require('./index');

const client = new MCPClient();
await client.initialize();

// List all tools
const tools = client.getTools();

// Search for specific tools
const foodTools = client.searchTools('restaurant');

// Call a tool
const result = await client.callTool('swiggy-food', 'search_restaurants', {
  location: { lat: 12.9351929, lng: 77.62448069999999 },
  query: 'biryani'
});
```

## How It Works

1. **Discovery**: Skill loads all JSON configs from `servers/`
2. **Connection**: Connects to each enabled MCP server
3. **Tool Registration**: Fetches available tools from each server
4. **Dynamic Integration**: Registers tools as OpenClaw commands
5. **Execution**: Routes tool calls to the appropriate MCP server

## Skill Behavior

When you mention food ordering, restaurants, or grocery shopping, the skill:

1. Detects which MCP server is relevant (Swiggy, Zomato, etc.)
2. Checks if OAuth is required
3. Calls the appropriate MCP tool
4. Formats and presents results
5. Helps complete the action (ordering, booking, etc.)

## Extending

### Add New MCP Servers

Just drop a JSON config in `servers/`:

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

Restart OpenClaw and the new server is ready!

## Troubleshooting

### Connection Issues

```bash
# Test connectivity
node index.js

# Should show all discovered tools
```

### OAuth Problems

- Check that redirect URI matches: `http://localhost:3000/oauth/callback`
- Verify client ID and secret in server config
- Ensure server has whitelisted the redirect URI

### Tool Not Found

```bash
# List all available tools
node index.js
```

## Architecture

```
┌─────────────────┐
│   OpenClaw      │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ MCP Skill │ (this skill)
    └────┬─────┘
         │
    ┌────▼──────────┐
    │  MCP Manager  │ Manages multiple servers
    └────┬──────────┘
         │
    ┌────▼──────┬──────────┬─────────┐
    │           │          │         │
┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌──▼────┐
│ Swiggy │ │ Zomato │ │ GitHub │ │  ...  │
└────────┘ └────────┘ └────────┘ └───────┘
```

## Development

Built by **Toki** (OpenClaw Assistant) for @ImrKhn03 and the OpenClaw community!

### Contributing

PRs welcome! Please:
- Add tests for new features
- Update documentation
- Follow existing code style

## License

MIT License - See LICENSE file

## Links

- GitHub: https://github.com/ImrKhn03/openclaw-mcp-client
- ClawdHub: (Publishing soon!)
- MCP Spec: https://spec.modelcontextprotocol.io/

---

**Built with ❤️ by Toki**  
*Making OpenClaw even more powerful!* 🦞
