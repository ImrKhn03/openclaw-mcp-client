#!/usr/bin/env node
/**
 * Interactive Grocery Shopping with Real Address
 */

const OpenClawMCPClient = require('./index');

async function interactiveShop() {
  const client = new OpenClawMCPClient();
  await client.initialize();

  try {
    // Step 1: Get addresses
    console.log('📍 Getting your saved addresses...\n');
    const addressResult = await client.callTool('swiggy-instamart', 'get_addresses', {});
    
    if (!addressResult.addresses || addressResult.addresses.length === 0) {
      console.log('❌ No saved addresses found!');
      return;
    }

    // Display addresses
    console.log('Your addresses:');
    addressResult.addresses.forEach((addr, idx) => {
      console.log(`\n${idx + 1}. ${addr.annotation || 'Address ' + (idx + 1)}`);
      console.log(`   ${addr.address}`);
      if (addr.area) console.log(`   Area: ${addr.area}`);
    });

    // Use first address
    const selectedAddress = addressResult.addresses[0];
    console.log(`\n✅ Using: ${selectedAddress.annotation || selectedAddress.address}`);
    console.log(`   Address ID: ${selectedAddress.id}\n`);

    // Step 2: Search for products
    console.log('🔍 Searching for milk...\n');
    const searchResult = await client.callTool('swiggy-instamart', 'search_products', {
      addressId: selectedAddress.id,
      query: 'milk',
      offset: 0
    });

    if (searchResult.products && searchResult.products.length > 0) {
      console.log(`Found ${searchResult.products.length} products:\n`);
      searchResult.products.slice(0, 5).forEach((product, idx) => {
        console.log(`${idx + 1}. ${product.display_name}`);
        console.log(`   Price: ₹${product.price || 'N/A'}`);
        console.log(`   ${product.in_stock ? '✅ In Stock' : '❌ Out of Stock'}\n`);
      });
    } else {
      console.log('No products found!');
    }

    // Step 3: Check cart
    console.log('\n🛒 Checking current cart...\n');
    const cartResult = await client.callTool('swiggy-instamart', 'get_cart', {});
    console.log(JSON.stringify(cartResult, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    client.shutdown();
  }
}

interactiveShop().catch(console.error);
