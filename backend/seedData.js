/**
 * Seed Data Script
 * Creates test users for Resident and Partner portals
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'datakomeza_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});

async function seedData() {
    const client = await pool.connect();

    try {
        console.log('🚀 Seeding test data...\n');

        // 1. Create Resident User
        // PIN: 123456
        const pinHash = await bcrypt.hash('123456', 10);

        const userRes = await client.query(`
            INSERT INTO users (
                email, pin_hash, first_name, last_name, mosip_id, 
                encryption_key, status, nationality, date_of_birth
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'active', 'Rwandan', '1990-01-01')
            ON CONFLICT (email) DO UPDATE 
            SET pin_hash = $2
            RETURNING id, email
        `, ['resident@example.com', pinHash, 'Test', 'Resident', 'RES123456', 'enc_key_123']);

        console.log('✅ Created Resident User:');
        console.log('   Email: resident@example.com');
        console.log('   PIN:   123456');

        // 2. Create Partner
        const partnerRes = await client.query(`
            INSERT INTO partners (
                partner_id, partner_name, partner_type, status,
                organization_name, email, approval_status
            )
            VALUES ($1, $2, $3, 'active', $4, $5, 'approved')
            ON CONFLICT (partner_id) DO NOTHING
            RETURNING id, partner_name
        `, ['PART_DEMO_123', 'Demo Partner', 'auth', 'Demo Org', 'partner@example.com']);

        if (partnerRes.rows.length > 0) {
            console.log('\n✅ Created Partner:');
            console.log('   ID:    PART_DEMO_123');
            console.log('   Name:  Demo Partner');
        } else {
            console.log('\nℹ️  Partner "Demo Partner" already exists');
        }

        console.log('\n✨ Seeding completed!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seedData();
