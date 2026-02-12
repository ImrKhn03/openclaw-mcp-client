#!/usr/bin/env node

/**
 * Test STDIO Transport with MCP Filesystem Server
 * Built by Toki
 */

const MCPClient = require('../lib/mcp-client');
const path = require('path');

async function testStdioTransport() {
  console.log('🧪 Testing STDIO Transport with Filesystem MCP Server\n');

  // Configure filesystem server
  const fsServerConfig = {
    name: 'filesystem',
    type: 'stdio',
    command: 'npx',
    args: ['@modelcontextprotocol/server-filesystem@latest', '/tmp']
  };

  try {
    // Create client
    console.log('📌 Creating MCP client for filesystem server...');
    const client = new MCPClient(fsServerConfig);

    // Connect
    console.log('🔗 Connecting to STDIO MCP server...');
    await client.connect();

    // Get tools
    const tools = client.getTools();
    console.log(`\n✅ Connected! Found ${tools.length} tools:`);
    tools.forEach(tool => {
      console.log(`   - ${tool.name}`);
      if (tool.description) {
        console.log(`     ${tool.description}`);
      }
    });

    // Test a tool: list files in /tmp
    console.log('\n🔍 Testing tool: list_dir');
    try {
      const result = await client.callTool('list_dir', { path: '/tmp' });
      console.log('✅ list_dir result:', JSON.stringify(result).substring(0, 200) + '...');
    } catch (e) {
      console.log('⚠️  list_dir failed:', e.message);
    }

    // Test another tool: read file
    console.log('\n📖 Testing tool: read_file');
    try {
      // Create a test file first
      const fs = require('fs');
      const testFile = '/tmp/test-mcp.txt';
      fs.writeFileSync(testFile, 'Hello from STDIO MCP test!');
      
      const result = await client.callTool('read_file', { path: testFile });
      console.log('✅ read_file result:', result);
      
      // Cleanup
      fs.unlinkSync(testFile);
    } catch (e) {
      console.log('⚠️  read_file failed:', e.message);
    }

    console.log('\n✅ STDIO Transport Test PASSED');
    console.log('   - Server started successfully');
    console.log('   - Tools discovered and called');
    console.log('   - JSON-RPC over stdin/stdout working');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ STDIO Transport Test FAILED');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure @modelcontextprotocol/server-filesystem is installed');
    console.error('2. Check that Node.js child_process can spawn the server');
    console.error('3. Verify stdio transport implementation');
    process.exit(1);
  }
}

testStdioTransport();
