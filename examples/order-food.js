/**
 * Example: Order Food from Swiggy
 * 
 * This example shows how to use the MCP client to search restaurants
 * and browse menus on Swiggy
 */

const OpenClawMCPClient = require('../index');

async function orderFood() {
  // Initialize MCP client
  const client = new OpenClawMCPClient();
  await client.initialize();

  try {
    // Your location (Bengaluru example)
    const location = {
      lat: 12.9351929,
      lng: 77.62448069999999
    };

    console.log('🔍 Searching for biryani restaurants...\n');

    // Search for restaurants
    const searchResult = await client.callTool('swiggy-food', 'search_restaurants', {
      location: location,
      query: 'biryani',
      filters: {
        sortBy: 'RATING'
      }
    });

    console.log(`Found ${searchResult.restaurants?.length || 0} restaurants:\n`);

    // Display top 5 restaurants
    const restaurants = searchResult.restaurants?.slice(0, 5) || [];
    restaurants.forEach((rest, idx) => {
      console.log(`${idx + 1}. ${rest.name}`);
      console.log(`   Rating: ${rest.rating}★ | ${rest.deliveryTime} mins | ${rest.costForTwo}`);
      console.log(`   ${rest.cuisines.join(', ')}`);
      console.log('');
    });

    if (restaurants.length > 0) {
      const topRestaurant = restaurants[0];
      console.log(`\n📋 Getting menu for: ${topRestaurant.name}...\n`);

      // Get menu
      const menuResult = await client.callTool('swiggy-food', 'get_menu', {
        restaurantId: topRestaurant.id,
        location: location
      });

      const menuItems = menuResult.menu?.slice(0, 10) || [];
      console.log('Top Menu Items:');
      menuItems.forEach((item, idx) => {
        const vegIcon = item.isVeg ? '🥬' : '🍖';
        console.log(`${idx + 1}. ${vegIcon} ${item.name} - ₹${item.price}`);
        if (item.description) {
          console.log(`   ${item.description.substring(0, 60)}...`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.message.includes('OAuth') || error.message.includes('auth')) {
      console.log('\n💡 Tip: You may need to set up OAuth first:');
      console.log('   await client.setupOAuth("swiggy-food", oauthConfig);');
    }
  } finally {
    client.shutdown();
  }
}

// Run if called directly
if (require.main === module) {
  orderFood().catch(console.error);
}

module.exports = orderFood;
