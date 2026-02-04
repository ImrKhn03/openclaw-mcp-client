#!/usr/bin/env node
/**
 * Example: Grocery Shopping with Swiggy Instamart
 * 
 * This example shows how to search for groceries and build a cart
 */

const OpenClawMCPClient = require('../index');

async function shopGroceries() {
  const client = new OpenClawMCPClient();
  await client.initialize();

  try {
    const location = {
      lat: 12.9351929,
      lng: 77.62448069999999
    };

    console.log('🛒 Swiggy Instamart - Quick Grocery Shopping\n');
    console.log('═'.repeat(60));

    // Search for common items
    const items = ['milk', 'bread', 'eggs'];
    const cart = [];

    for (const item of items) {
      console.log(`\n🔍 Searching for: ${item}...`);
      
      try {
        const result = await client.callTool('swiggy-instamart', 'search_products', {
          location: location,
          query: item
        });

        if (result.products && result.products.length > 0) {
          const topProducts = result.products.slice(0, 3);
          
          console.log(`\nTop ${topProducts.length} results:`);
          topProducts.forEach((product, idx) => {
            console.log(`\n${idx + 1}. ${product.name}`);
            console.log(`   Brand: ${product.brand || 'N/A'}`);
            console.log(`   Price: ₹${product.price} ${product.unit || ''}`);
            if (product.discount) {
              console.log(`   Discount: ${product.discount}% off`);
            }
            console.log(`   Stock: ${product.inStock ? '✅ In Stock' : '❌ Out of Stock'}`);
          });

          // Add first in-stock item to cart
          const firstAvailable = topProducts.find(p => p.inStock);
          if (firstAvailable) {
            cart.push({
              name: firstAvailable.name,
              price: firstAvailable.price,
              quantity: 1
            });
            console.log(`\n   ➕ Added to cart: ${firstAvailable.name}`);
          }
        } else {
          console.log(`   ❌ No results found for "${item}"`);
        }
      } catch (err) {
        console.log(`   ⚠️  Search failed: ${err.message}`);
      }

      // Small delay between searches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Show cart summary
    if (cart.length > 0) {
      console.log('\n\n' + '═'.repeat(60));
      console.log('🛒 Your Cart:');
      console.log('═'.repeat(60));
      
      let total = 0;
      cart.forEach((item, idx) => {
        console.log(`\n${idx + 1}. ${item.name}`);
        console.log(`   Qty: ${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}`);
        total += item.quantity * item.price;
      });

      console.log('\n' + '─'.repeat(60));
      console.log(`Total: ₹${total}`);
      console.log('═'.repeat(60));

      console.log('\n💡 Next steps:');
      console.log('   1. Review your cart');
      console.log('   2. Apply coupons (if any)');
      console.log('   3. Choose delivery slot');
      console.log('   4. Place order');
      console.log('\n⚠️  Note: This is a demo. Use the actual Swiggy app to place orders.');
    } else {
      console.log('\n\n❌ No items added to cart');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('OAuth') || error.message.includes('auth')) {
      console.log('\n💡 OAuth Setup Required:');
      console.log('   node scripts/setup-oauth.js swiggy-instamart');
    }
  } finally {
    console.log('');
    client.shutdown();
  }
}

if (require.main === module) {
  shopGroceries().catch(console.error);
}

module.exports = shopGroceries;
