import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        isAdmin: true
      }
    })

    console.log('Admin user created successfully:')
    console.log('Email: admin@example.com')
    console.log('Password: admin123')
    console.log('User ID:', admin.id)
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
