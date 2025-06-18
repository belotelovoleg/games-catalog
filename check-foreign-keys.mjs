import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkForeignKeys() {
  try {
    console.log('Checking current foreign key constraints...');
      const result = await prisma.$queryRaw`
      SELECT 
        conname::text as constraint_name,
        conrelid::regclass::text as table_name,
        confrelid::regclass::text as referenced_table
      FROM pg_constraint 
      WHERE contype = 'f'
      ORDER by conname;
    `;
    
    console.log('Current foreign key constraints:');
    console.table(result);
    
  } catch (error) {
    console.error('Error checking foreign keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkForeignKeys();
