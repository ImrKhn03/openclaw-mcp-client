/**
 * Example: List All Available MCP Tools
 */

const OpenClawMCPClient = require('../index');

async function listTools() {
  const client = new OpenClawMCPClient();
  await client.initialize();

  console.log('\n📋 All Available MCP Tools:\n');
  console.log('═'.repeat(80));

  const tools = client.getTools();
  
  // Group by server
  const byServer = tools.reduce((acc, tool) => {
    if (!acc[tool.server]) {
      acc[tool.server] = [];
    }
    acc[tool.server].push(tool);
    return acc;
  }, {});

  for (const [server, serverTools] of Object.entries(byServer)) {
    console.log(`\n🔌 ${server.toUpperCase()} (${serverTools.length} tools)`);
    console.log('─'.repeat(80));
    
    serverTools.forEach(tool => {
      console.log(`\n  📦 ${tool.name}`);
      if (tool.description) {
        console.log(`     ${tool.description}`);
      }
      if (tool.inputSchema) {
        const params = Object.keys(tool.inputSchema.properties || {});
        if (params.length > 0) {
          console.log(`     Parameters: ${params.join(', ')}`);
        }
      }
    });
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`\n✅ Total: ${tools.length} tools across ${Object.keys(byServer).length} servers\n`);

  client.shutdown();
}

if (require.main === module) {
  listTools().catch(console.error);
}

module.exports = listTools;
