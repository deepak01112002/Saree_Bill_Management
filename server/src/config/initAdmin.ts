import connectDB from './database';
import User from '../models/User';
import bcrypt from 'bcryptjs';

const DEFAULT_ADMIN_EMAIL = 'admin@saree.com';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const DEFAULT_ADMIN_NAME = 'Admin User';

/**
 * Initialize default admin user if it doesn't exist
 */
export async function initDefaultAdmin() {
  try {
    await connectDB();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('✅ Default admin user already exists');
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);

    const adminUser = await User.create({
      name: DEFAULT_ADMIN_NAME,
      email: DEFAULT_ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('✅ Default admin user created successfully');
    console.log(`   Email: ${DEFAULT_ADMIN_EMAIL}`);
    console.log(`   Password: ${DEFAULT_ADMIN_PASSWORD}`);
    console.log('   ⚠️  Please change the password after first login!');
  } catch (error: any) {
    console.error('❌ Error creating default admin user:', error.message);
  }
}


