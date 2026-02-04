# 🗺️ OpenClaw MCP Client - Improvement Roadmap

> **Built by Toki** - Making this skill universal and production-ready!

**Current Version:** 1.0.0  
**Status:** ✅ Functional (Swiggy Food + Instamart working)  
**Goal:** 🎯 Universal, plug-and-play MCP skill for ANY OpenClaw bot

---

## 🎯 Vision

**Make this the UNIVERSAL MCP bridge for OpenClaw ecosystem:**
- Any OpenClaw bot can install as a skill
- Works with ANY MCP server (not just Swiggy/Zomato)
- Zero-config for standard MCP servers
- Simple OAuth setup flow
- Published on ClawdHub for easy discovery

---

## 🚀 Phase 1: Core Stability & Usability (Priority: HIGH)

### 1.1 Installation Experience
- [ ] **Create automated installer script**
  - Auto-detect OpenClaw workspace
  - Install dependencies
  - Run verification tests
  - Print setup instructions
  
- [ ] **Add pre-install checks**
  - Node.js version >= 18
  - OpenClaw installation detected
  - Network connectivity
  - Write permissions

- [ ] **Improve SKILL.md integration**
  - Add clear usage examples for OpenClaw
  - Document natural language patterns
  - Add troubleshooting section

**Files to create:**
- `install.sh` - One-command installer
- `scripts/pre-install-check.js` - Environment validation
- Better SKILL.md with examples

### 1.2 OAuth Flow Improvements
- [ ] **Simplify OAuth setup**
  - Interactive CLI wizard (`npm run oauth`)
  - Server selection menu
  - Auto-open browser for auth
  - Store credentials securely
  
- [ ] **Add OAuth status command**
  - `npm run oauth:status` - Show which servers are authenticated
  - `npm run oauth:refresh` - Refresh expired tokens
  - `npm run oauth:clear [server]` - Clear tokens

- [ ] **Token refresh automation**
  - Auto-refresh expired tokens
  - Handle 401 gracefully and re-auth
  - Notification when manual re-auth needed

**Files to update:**
- `lib/oauth.js` - Better refresh logic
- `scripts/oauth-wizard.js` - New interactive setup
- `scripts/oauth-status.js` - Status checker

### 1.3 Error Handling & Logging
- [ ] **Better error messages**
  - User-friendly error descriptions
  - Actionable suggestions ("Run `npm run oauth swiggy-food`")
  - Error codes for debugging

- [ ] **Logging system**
  - Configurable log levels (debug, info, warn, error)
  - Log to file option
  - Structured JSON logs for parsing

- [ ] **Graceful degradation**
  - If one server fails, others keep working ✅ (Already done!)
  - Cache failed requests and retry
  - Fallback mechanisms

**Files to create:**
- `lib/logger.js` - Centralized logging
- `lib/error-handler.js` - Error formatting & suggestions

---

## 🔌 Phase 2: Universal MCP Support (Priority: HIGH)

### 2.1 Support Multiple Transport Types
Currently only HTTP. Add:

- [ ] **STDIO Transport** (many MCP servers use this)
  - Spawn child process
  - JSON-RPC over stdin/stdout
  - Process lifecycle management

- [ ] **SSE (Server-Sent Events) Transport**
  - Streaming responses
  - Real-time updates
  - Progress notifications

- [ ] **WebSocket Transport** (future)
  - Bi-directional communication
  - Lower latency

**Files to create:**
- `lib/stdio-transport.js` - STDIO implementation
- `lib/sse-transport.js` - SSE implementation
- Update `lib/mcp-client.js` to auto-detect transport type

### 2.2 MCP Server Discovery
- [ ] **Auto-discover local MCP servers**
  - Scan common installation paths
  - Read Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`)
  - Import server configs automatically

- [ ] **MCP Registry integration**
  - Fetch from https://mcp-registry.org (if exists)
  - Browse available servers
  - One-click install

- [ ] **Server templates**
  - Pre-configured templates for popular servers
  - GitHub, Slack, Google Drive, databases, etc.
  - `npm run add-server github` → installs template

**Files to create:**
- `lib/server-discovery.js` - Find MCP servers
- `templates/` directory with common server configs
- `scripts/add-server.js` - Interactive server addition

### 2.3 Config Management
- [ ] **Environment variable support**
  ```json
  {
    "clientId": "${SWIGGY_CLIENT_ID}",
    "clientSecret": "${SWIGGY_CLIENT_SECRET}"
  }
  ```

- [ ] **Config validation**
  - JSON schema validation
  - Required field checks
  - URL validation

- [ ] **Config versioning**
  - Migrate old configs to new format
  - Backward compatibility

**Files to update:**
- `lib/config-loader.js` - New config loader with validation
- Add JSON schema files

---

## 🎨 Phase 3: Developer Experience (Priority: MEDIUM)

### 3.1 Testing & Quality
- [ ] **Unit tests**
  - Test each transport type
  - Test OAuth flows
  - Test error handling
  - Use Jest or Mocha

- [ ] **Integration tests**
  - Test with real MCP servers
  - Mock servers for testing
  - CI/CD pipeline

- [ ] **Code documentation**
  - JSDoc comments
  - API reference generator
  - Architecture diagrams

**Files to create:**
- `tests/` directory
- `test/mocks/` for mock servers
- `.github/workflows/test.yml` - GitHub Actions

### 3.2 CLI Tool
Make it usable standalone:

```bash
# Install globally
npm install -g openclaw-mcp-client

# Use as CLI
mcp-client list-servers
mcp-client add-server github
mcp-client call swiggy-food search_restaurants --lat 12.9 --lng 77.6
mcp-client oauth setup swiggy-food
```

- [ ] **Build CLI interface**
  - Commander.js for CLI
  - Interactive prompts
  - Pretty output formatting

**Files to create:**
- `bin/mcp-client.js` - CLI entry point
- Add `bin` to package.json

### 3.3 Documentation
- [ ] **Complete API docs**
  - Every function documented
  - Type definitions (TypeScript .d.ts or JSDoc)
  - Usage examples for each

- [ ] **Video tutorials**
  - Setup walkthrough
  - OAuth configuration
  - Adding new servers
  - Integration with OpenClaw

- [ ] **Migration guides**
  - From manual MCP usage
  - Version upgrades

**Files to create:**
- `docs/` directory
- `docs/api/` API reference
- `docs/guides/` tutorials

---

## 🌟 Phase 4: Advanced Features (Priority: LOW)

### 4.1 Caching & Performance
- [ ] **Response caching**
  - Cache GET requests
  - TTL configuration
  - Cache invalidation

- [ ] **Request batching**
  - Batch multiple tool calls
  - Reduce network overhead

- [ ] **Connection pooling**
  - Reuse HTTP connections
  - Reduce latency

**Files to create:**
- `lib/cache.js` - Caching layer
- `lib/batch-processor.js` - Request batching

### 4.2 Monitoring & Analytics
- [ ] **Usage tracking**
  - Count tool calls
  - Track success/failure rates
  - Performance metrics

- [ ] **Health checks**
  - Periodic server health pings
  - Alert when servers go down
  - Auto-reconnect

- [ ] **Dashboard (optional)**
  - Web UI to view stats
  - Server management interface
  - Live logs

**Files to create:**
- `lib/analytics.js` - Usage tracking
- `lib/health-monitor.js` - Health checks
- `web/` dashboard (future)

### 4.3 Security Enhancements
- [ ] **Token encryption**
  - Encrypt stored OAuth tokens
  - Use system keychain (macOS/Windows)
  - Encrypted storage

- [ ] **Rate limiting**
  - Respect server rate limits
  - Queue requests
  - Backoff strategies

- [ ] **Permission system**
  - User confirmation for sensitive actions
  - Whitelist/blacklist tools
  - Audit logs

**Files to update:**
- `lib/oauth.js` - Token encryption
- `lib/rate-limiter.js` - New rate limiting
- `lib/permissions.js` - Permission system

---

## 📦 Phase 5: Distribution & Community (Priority: MEDIUM)

### 5.1 Package Distribution
- [ ] **Publish to npm**
  - `npm publish openclaw-mcp-client`
  - Semantic versioning
  - Changelog automation

- [ ] **Publish to ClawdHub**
  - Create skill listing
  - Add screenshots
  - User reviews

- [ ] **GitHub Releases**
  - Automated release notes
  - Binary distributions (if needed)
  - Update notifications

### 5.2 Community Building
- [ ] **Contributing guide**
  - Code of conduct
  - How to add new servers
  - Pull request template

- [ ] **Issue templates**
  - Bug reports
  - Feature requests
  - Server addition requests

- [ ] **Examples repository**
  - Community-contributed configs
  - Use case examples
  - Integration patterns

**Files to create:**
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `.github/ISSUE_TEMPLATE/` templates
- `.github/PULL_REQUEST_TEMPLATE.md`

### 5.3 Server Config Repository
Create separate repo for server configs:

```
openclaw-mcp-servers/
├── swiggy-food.json
├── swiggy-instamart.json
├── github.json
├── slack.json
├── google-drive.json
└── README.md
```

- Users can submit PRs for new servers
- Auto-sync to main package
- Versioned configs

---

## 🎯 Quick Wins (Do First!)

### Week 1: Polish & Usability
1. ✅ Fix Zomato (disable if not working)
2. Create `install.sh` script
3. Improve OAuth wizard
4. Add `npm run oauth:status`
5. Better error messages

### Week 2: Universal Support
6. Add STDIO transport
7. Add server templates (GitHub, Slack)
8. Auto-detect Claude Desktop servers
9. Config validation

### Week 3: Documentation & Testing
10. Write comprehensive API docs
11. Add unit tests
12. Create video tutorial
13. Publish to npm

### Week 4: Community & Distribution
14. Publish to ClawdHub
15. Create contributing guide
16. Set up GitHub Actions CI
17. Announce on Discord/Twitter

---

## 📊 Success Metrics

### Technical
- ✅ Supports 3+ transport types (HTTP, STDIO, SSE)
- ✅ Works with 10+ different MCP servers
- ✅ 90%+ test coverage
- ✅ <5 second cold start
- ✅ <100ms tool call overhead

### User Experience
- ✅ 5-minute setup time
- ✅ One-command installation
- ✅ Clear error messages
- ✅ No manual config editing needed

### Adoption
- ✅ 50+ installations on ClawdHub
- ✅ 10+ community-contributed server configs
- ✅ 5+ GitHub stars/week
- ✅ Featured in OpenClaw docs

---

## 🚧 Known Issues to Fix

1. **Cart stability** - Items disappearing from Swiggy cart (observed during testing)
2. **Menu search** - Some restaurants return empty results
3. **Token refresh** - No automatic refresh on expiry
4. **Error handling** - Some errors don't have helpful messages
5. **STDIO support** - Currently only HTTP works
6. **Config validation** - No schema validation yet

---

## 💡 Ideas for Future

- **MCP Proxy Mode**: Run as proxy server, multiple OpenClaw instances can share one MCP connection
- **Visual Flow Builder**: Drag-and-drop tool chaining
- **Plugin System**: Community can add custom transport types
- **MCP Server Creator**: Tool to build your own MCP servers easily
- **Multi-user OAuth**: Support multiple user accounts per server
- **Webhook Support**: Receive events from MCP servers
- **GraphQL Layer**: Query multiple MCP servers with one request

---

## 📝 Notes

- Focus on **stability** before features
- **Documentation** is as important as code
- Make it **beginner-friendly** - assume no MCP knowledge
- Keep it **lightweight** - fast startup, low memory
- **Community-driven** - accept PRs, listen to feedback

---

**Built by Toki 🦞**  
**For Imran (@ImrKhn03) and the OpenClaw Community**

*Last Updated: 2026-02-04*
