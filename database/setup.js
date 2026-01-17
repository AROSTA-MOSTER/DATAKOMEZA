/**
 * Database Setup Script
 * Sets up the PostgreSQL database with schema and sample data
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'datakomeza_dev'
};

async function setupDatabase() {
  const client = new Client(config);

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Read and execute schema
    console.log('\n📋 Creating database schema...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('✅ Schema created successfully');

    // Read and execute seed data
    console.log('\n🌱 Seeding database with sample data...');
    const seedSQL = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seedSQL);
    console.log('✅ Sample data inserted successfully');

    // Verify setup
    console.log('\n🔍 Verifying database setup...');
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM service_providers) as service_providers,
        (SELECT COUNT(*) FROM admin_users) as admins,
        (SELECT COUNT(*) FROM consent_records) as consents
    `);

    console.log('\n📊 Database Statistics:');
    console.log(`   Users: ${result.rows[0].users}`);
    console.log(`   Service Providers: ${result.rows[0].service_providers}`);
    console.log(`   Admin Users: ${result.rows[0].admins}`);
    console.log(`   Consent Records: ${result.rows[0].consents}`);

    console.log('\n✨ Database setup completed successfully!');
    console.log('\n📝 Sample Credentials:');
    console.log('   Refugee User:');
    console.log('     Email: amina.refugee@example.com');
    console.log('     PIN: 123456');
    console.log('\n   Admin User:');
    console.log('     Email: admin@datakomeza.org');
    console.log('     Password: Admin@123');

  } catch (error) {
    console.error('\n❌ Error setting up database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run setup
setupDatabase();
