// Simple test script to verify social graph functionality
import { socialGraphService } from './server/services/social-graph.ts';
import { storage } from './server/storage.ts';

async function testSocialGraph() {
  try {
    console.log('🧪 Testing Social Graph Service...');
    
    // Get some test users
    const user1 = await storage.getUserByUsername('crickfan');
    const user2 = await storage.getUserByUsername('teamIndia');
    
    if (!user1 || !user2) {
      console.error('❌ Test users not found');
      return;
    }
    
    console.log(`👤 User 1: ${user1.username} (ID: ${user1.id})`);
    console.log(`👤 User 2: ${user2.username} (ID: ${user2.id})`);
    
    // Test relationship status
    console.log('\n🔍 Testing relationship status...');
    const relationshipStatus = await socialGraphService.getRelationshipStatus(user1.id, user2.id);
    console.log(`📊 Relationship status: ${relationshipStatus}`);
    
    // Test follow functionality
    console.log('\n👥 Testing follow functionality...');
    const followResult = await socialGraphService.followUser(user1.id, user2.id);
    console.log(`✅ Follow result:`, followResult);
    
    // Check relationship status after follow
    const newStatus = await socialGraphService.getRelationshipStatus(user1.id, user2.id);
    console.log(`📊 New relationship status: ${newStatus}`);
    
    // Test getting followers
    console.log('\n👥 Testing get followers...');
    const followers = await socialGraphService.getFollowers(user2.id, user1.id);
    console.log(`👥 ${user2.username} has ${followers.length} followers`);
    
    console.log('\n✅ Social Graph Service tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSocialGraph().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});