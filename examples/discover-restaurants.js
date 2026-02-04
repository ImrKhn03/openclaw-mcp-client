#!/usr/bin/env node
/**
 * Example: Restaurant Discovery with Zomato
 * 
 * Discover restaurants, check ratings, and browse menus
 */

const OpenClawMCPClient = require('../index');

async function discoverRestaurants() {
  const client = new OpenClawMCPClient();
  await client.initialize();

  try {
    const location = {
      lat: 12.9351929,
      lng: 77.62448069999999,
      name: 'Bengaluru, Karnataka'
    };

    console.log('🍽️  Zomato Restaurant Discovery\n');
    console.log('═'.repeat(60));
    console.log(`📍 Location: ${location.name}\n`);

    // Discover trending restaurants
    console.log('🔥 Discovering trending restaurants...\n');

    try {
      const result = await client.callTool('zomato', 'discover_restaurants', {
        location: location,
        category: 'trending',
        filters: {
          cuisine: ['North Indian', 'Chinese', 'South Indian'],
          sortBy: 'rating'
        }
      });

      if (result.restaurants && result.restaurants.length > 0) {
        const restaurants = result.restaurants.slice(0, 10);
        
        console.log(`Found ${result.total || restaurants.length} restaurants:\n`);

        restaurants.forEach((rest, idx) => {
          console.log(`${idx + 1}. ${rest.name}`);
          console.log(`   ⭐ ${rest.rating}/5 (${rest.votes || 0} votes)`);
          console.log(`   📍 ${rest.locality || rest.address}`);
          console.log(`   💰 ${rest.costForTwo || 'N/A'} for two`);
          console.log(`   🍽️  ${rest.cuisines ? rest.cuisines.join(', ') : 'Various'}`);
          console.log(`   🚚 Delivery: ${rest.hasDelivery ? '✅' : '❌'} | Dining: ${rest.hasDining ? '✅' : '❌'}`);
          
          if (rest.offers && rest.offers.length > 0) {
            console.log(`   🎁 ${rest.offers[0]}`);
          }
          
          console.log('');
        });

        // Show detailed info for top restaurant
        if (restaurants.length > 0) {
          const topRest = restaurants[0];
          console.log('═'.repeat(60));
          console.log(`🏆 Top Restaurant: ${topRest.name}`);
          console.log('═'.repeat(60));
          
          // Get menu
          try {
            console.log('\n📋 Fetching menu...\n');
            const menuResult = await client.callTool('zomato', 'get_menu', {
              restaurantId: topRest.id
            });

            if (menuResult.menu && menuResult.menu.length > 0) {
              // Group by category
              const categories = {};
              menuResult.menu.forEach(item => {
                const cat = item.category || 'Other';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(item);
              });

              Object.entries(categories).slice(0, 3).forEach(([category, items]) => {
                console.log(`\n🍴 ${category}:`);
                items.slice(0, 5).forEach(item => {
                  const vegIcon = item.isVeg ? '🥬' : item.isVeg === false ? '🍖' : '  ';
                  const price = item.price ? `₹${item.price}` : 'Price not listed';
                  console.log(`   ${vegIcon} ${item.name} - ${price}`);
                  if (item.description) {
                    const desc = item.description.substring(0, 60);
                    console.log(`      ${desc}${item.description.length > 60 ? '...' : ''}`);
                  }
                });
              });
            }
          } catch (menuErr) {
            console.log(`   ⚠️  Couldn't fetch menu: ${menuErr.message}`);
          }

          console.log('\n' + '═'.repeat(60));
          console.log('💡 To order from this restaurant:');
          console.log(`   1. Open Zomato app/website`);
          console.log(`   2. Search for: ${topRest.name}`);
          console.log(`   3. Browse menu and place order`);
        }

      } else {
        console.log('❌ No restaurants found');
      }

    } catch (err) {
      console.log(`⚠️  Discovery failed: ${err.message}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('OAuth') || error.message.includes('auth')) {
      console.log('\n💡 OAuth Setup Required:');
      console.log('   node scripts/setup-oauth.js zomato');
    }
  } finally {
    console.log('');
    client.shutdown();
  }
}

if (require.main === module) {
  discoverRestaurants().catch(console.error);
}

module.exports = discoverRestaurants;
