# 📋 OpenClaw MCP Client - Action Plan

> **Quick reference for immediate next steps**

## 🎯 THIS WEEK: Quick Wins

### Priority 1: Installation & Setup (2-3 hours)
- [ ] Create `install.sh` automated installer
- [ ] Add pre-install checks (`scripts/pre-install-check.js`)
- [ ] Test installation on fresh OpenClaw instance
- [ ] Document any issues found

### Priority 2: OAuth Improvements (3-4 hours)
- [ ] Create OAuth wizard (`scripts/oauth-wizard.js`)
- [ ] Add OAuth status checker (`npm run oauth:status`)
- [ ] Improve error messages for auth failures
- [ ] Test OAuth flow end-to-end

### Priority 3: Documentation (2-3 hours)
- [ ] Expand SKILL.md with real usage examples
- [ ] Add troubleshooting section
- [ ] Create quick start video (5 min screencast)
- [ ] Update README with better examples

---

## 🚀 NEXT WEEK: Universal Support

### Priority 1: STDIO Transport (4-5 hours)
- [ ] Research STDIO MCP spec
- [ ] Create `lib/stdio-transport.js`
- [ ] Update `lib/mcp-client.js` to auto-detect transport
- [ ] Test with a STDIO MCP server (e.g., filesystem-server)
- [ ] Add documentation

### Priority 2: Server Templates (2-3 hours)
- [ ] Create `templates/` directory
- [ ] Add templates for:
  - [ ] GitHub MCP
  - [ ] Slack MCP
  - [ ] Google Drive MCP
  - [ ] PostgreSQL MCP
- [ ] Create `npm run add-server <name>` command

### Priority 3: Config Improvements (2-3 hours)
- [ ] Add environment variable support
- [ ] Create JSON schema for validation
- [ ] Add config validator
- [ ] Handle missing/invalid configs gracefully

---

## 📦 WEEK 3: Testing & Quality

### Priority 1: Tests (5-6 hours)
- [ ] Set up Jest
- [ ] Write unit tests for:
  - [ ] HTTP transport
  - [ ] OAuth flow
  - [ ] MCP Manager
  - [ ] Config loader
- [ ] Add integration tests
- [ ] Set up GitHub Actions CI

### Priority 2: CLI Tool (3-4 hours)
- [ ] Install Commander.js
- [ ] Create `bin/mcp-client.js`
- [ ] Add commands:
  - `list-servers`
  - `add-server <name>`
  - `call <server> <tool> <args>`
  - `oauth setup <server>`
- [ ] Test CLI locally

### Priority 3: Code Quality (2-3 hours)
- [ ] Add JSDoc comments everywhere
- [ ] Run linter (ESLint)
- [ ] Add prettier for formatting
- [ ] Generate API docs

---

## 🌟 WEEK 4: Distribution

### Priority 1: npm Publishing (2-3 hours)
- [ ] Update package.json metadata
- [ ] Test `npm pack` locally
- [ ] Publish to npm registry
- [ ] Test installation from npm
- [ ] Add install badge to README

### Priority 2: ClawdHub (3-4 hours)
- [ ] Review ClawdHub submission guidelines
- [ ] Prepare skill listing:
  - Description
  - Screenshots
  - Demo video
  - Tags
- [ ] Submit to ClawdHub
- [ ] Monitor for approval

### Priority 3: Community (2-3 hours)
- [ ] Create `CONTRIBUTING.md`
- [ ] Add issue templates
- [ ] Add PR template
- [ ] Announce on:
  - OpenClaw Discord
  - Twitter/X
  - Reddit (if relevant)

---

## 🔧 Immediate Tasks (Today!)

### Task 1: Create Install Script (30 min)
**File:** `install.sh`

```bash
#!/bin/bash
# OpenClaw MCP Client Installer
# Built by Toki

echo "🦞 OpenClaw MCP Client Installer"
echo "================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js >= 18"
    exit 1
fi

# Check version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be >= 18 (current: $(node -v))"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run verification
echo "🔍 Verifying installation..."
npm run verify

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Review servers in ./servers/ directory"
echo "2. Set up OAuth: npm run oauth"
echo "3. Test: npm run list-tools"
echo ""
echo "Documentation: README.md"
echo "Built by Toki 🦞"
```

### Task 2: OAuth Status Checker (30 min)
**File:** `scripts/oauth-status.js`

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '../.oauth-tokens.json');
const SERVER_DIR = path.join(__dirname, '../servers');

async function checkStatus() {
  console.log('🔐 OAuth Status Report\n');

  // Load tokens
  let tokens = {};
  try {
    tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  } catch (e) {
    // No tokens yet
  }

  // Load server configs
  const servers = fs.readdirSync(SERVER_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const config = JSON.parse(fs.readFileSync(path.join(SERVER_DIR, f)));
      return config;
    })
    .filter(c => c.enabled !== false);

  // Check each server
  for (const server of servers) {
    const hasToken = !!tokens[server.name];
    const needsAuth = server.oauth?.required === true;

    const status = hasToken ? '✅' : (needsAuth ? '❌' : '⚪');
    const statusText = hasToken ? 'Authenticated' : (needsAuth ? 'Needs OAuth' : 'No auth required');

    console.log(`${status} ${server.name.padEnd(20)} ${statusText}`);

    if (!hasToken && needsAuth) {
      console.log(`   → Run: npm run oauth ${server.name}`);
    }
  }

  console.log(`\n✅ ${Object.keys(tokens).length} servers authenticated`);
}

checkStatus();
```

### Task 3: Update package.json Scripts (5 min)

```json
{
  "scripts": {
    "start": "node index.js",
    "test": "jest",
    "verify": "node scripts/verify-install.js",
    "list-tools": "node examples/list-tools.js",
    "order-food": "node examples/order-food.js",
    "shop-groceries": "node examples/shop-groceries.js",
    "discover-restaurants": "node examples/discover-restaurants.js",
    "oauth": "node scripts/oauth-wizard.js",
    "oauth:status": "node scripts/oauth-status.js"
  }
}
```

---

## 🎯 Success Criteria for v1.1

- [ ] Install script works on fresh system
- [ ] OAuth flow is smooth (< 5 clicks)
- [ ] STDIO transport works
- [ ] 3+ server templates available
- [ ] Published to npm
- [ ] Published to ClawdHub
- [ ] 10+ unit tests passing
- [ ] Complete documentation

---

## 📊 Progress Tracking

**Current State:** v1.0.0
- ✅ HTTP transport working
- ✅ Swiggy Food & Instamart working
- ✅ Basic OAuth flow
- ✅ Multi-server management
- ✅ Error handling
- ⚠️ Zomato disabled (not compatible)
- ❌ No STDIO support yet
- ❌ No tests yet
- ❌ Not published yet

**Target State:** v1.1.0 (2 weeks)
- ✅ HTTP + STDIO transports
- ✅ 5+ MCP servers supported
- ✅ Smooth OAuth setup
- ✅ Published to npm + ClawdHub
- ✅ 80%+ test coverage
- ✅ CLI tool available
- ✅ Comprehensive docs

---

## 💬 Questions to Answer

1. **Transport Priority:** Should we support STDIO first or SSE?
   - **Answer:** STDIO (more MCP servers use it)

2. **CLI vs Library:** Focus on CLI or programmatic API?
   - **Answer:** Both! Library for OpenClaw, CLI for debugging

3. **Server Discovery:** Auto-discover or manual config?
   - **Answer:** Both! Auto-discover + manual override

4. **Token Storage:** File or system keychain?
   - **Answer:** File for v1.1, keychain for v1.2

5. **Testing Strategy:** Unit tests or integration tests first?
   - **Answer:** Both! Unit for core, integration for transports

---

**Let's build this! 🚀**

*Built by Toki for @ImrKhn03*
