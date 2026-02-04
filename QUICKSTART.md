# Quick Start Guide

Get up and running with OpenClaw MCP Client in 5 minutes!

## 📦 Step 1: Install

```bash
cd ~/.openclaw/workspace/skills
git clone https://github.com/ImrKhn03/openclaw-mcp-client.git
cd openclaw-mcp-client
npm install
```

## ✅ Step 2: Verify Installation

```bash
npm run verify
```

You should see all green checkmarks ✅

## 🔍 Step 3: See What's Available

```bash
npm run list-tools
```

This shows all MCP servers and their available tools.

## 🍕 Step 4: Try an Example

### Option A: Order Food (requires OAuth)

```bash
npm run order-food
```

This will search for biryani restaurants on Swiggy and show menus.

**Note:** If you get an auth error, you need to set up OAuth first (see Step 5).

### Option B: Discover Restaurants (requires OAuth)

```bash
npm run discover-restaurants
```

Browse trending restaurants on Zomato with ratings and menus.

### Option C: Shop Groceries (requires OAuth)

```bash
npm run shop-groceries
```

Search for milk, bread, and eggs on Swiggy Instamart.

## 🔐 Step 5: Set Up OAuth (Optional but Recommended)

For Swiggy and Zomato, you need OAuth tokens:

```bash
npm run setup-oauth swiggy-food
# Follow the prompts - you'll need:
# - Client ID from Swiggy Developer Console
# - Client Secret
# Then authorize in your browser
```

Repeat for other services:
```bash
npm run setup-oauth swiggy-instamart
npm run setup-oauth zomato
```

**Don't have API credentials?**  
That's okay! The skill still works in demo mode. You'll see the structure and can test with real credentials later.

## 🤖 Step 6: Use with OpenClaw

Once installed, just talk to OpenClaw naturally:

```
"Order biryani from Swiggy"
"Find Italian restaurants on Zomato"
"Add milk to my Instamart cart"
```

OpenClaw will automatically:
1. Detect which MCP server to use
2. Call the appropriate tools
3. Format results nicely
4. Help you complete the action

## 🎯 Common Commands

```bash
# Check all servers status
npm start

# Verify everything works
npm run verify

# List all available tools
npm run list-tools

# Run examples
npm run order-food
npm run shop-groceries
npm run discover-restaurants

# Set up authentication
npm run setup-oauth <server-name>
```

## 🔌 Adding More MCP Servers

Want to connect to GitHub, Slack, or other MCP servers?

1. Create a JSON file in `servers/` directory:

```json
{
  "name": "my-server",
  "type": "http",
  "url": "https://mcp.myserver.com",
  "enabled": true,
  "description": "My custom MCP server"
}
```

2. Restart OpenClaw - Done! The new server is auto-discovered.

## 🆘 Having Issues?

```bash
# Run verification
npm run verify

# Check troubleshooting guide
cat TROUBLESHOOTING.md

# Report a bug
# https://github.com/ImrKhn03/openclaw-mcp-client/issues
```

## 🚀 What's Next?

- Read the full [README.md](README.md) for advanced usage
- Check [SKILL.md](SKILL.md) for OpenClaw integration details
- Browse [examples/](examples/) for more code samples
- Explore [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if you hit issues

## 💡 Pro Tips

1. **Start with one server** - Get Swiggy working before adding more
2. **Use examples** - They show the correct API usage
3. **Check status often** - Run `npm start` to see what's connected
4. **Keep tokens safe** - Never commit OAuth tokens to version control
5. **Read errors carefully** - They usually tell you exactly what's wrong

---

**That's it! You're ready to connect OpenClaw to the MCP universe!** 🦞✨

Questions? Open an issue on GitHub!
