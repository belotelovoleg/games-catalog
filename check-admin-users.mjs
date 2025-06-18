import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log('Checking for admin users...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true
      }
    });
    
    console.log(`\n📊 Found ${users.length} users in database:`);
    console.log('=' .repeat(80));
    
    if (users.length === 0) {
      console.log('❌ No users found! You need to create an admin user first.');
      console.log('\nTo create an admin user, run:');
      console.log('npm run create-admin');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Admin: ${user.isAdmin ? '✅ YES' : '❌ NO'}`);
        console.log(`   Created: ${user.createdAt}`);
      });
      
      const adminUsers = users.filter(u => u.isAdmin);
      if (adminUsers.length === 0) {
        console.log('\n❌ No admin users found! You need to make a user admin first.');
      } else {
        console.log(`\n✅ Found ${adminUsers.length} admin user(s)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers();
