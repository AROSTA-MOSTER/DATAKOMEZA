/**
 * Complete Database Setup
 * Runs all migrations in order
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'datakomeza_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});

async function runSetup() {
    const client = await pool.connect();

    try {
        console.log('🚀 Database Setup Starting...\n');

        // Clean Database (Reset)
        console.log('🧹 Cleaning existing database...');
        await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
        await client.query('GRANT ALL ON SCHEMA public TO postgres;');
        await client.query('GRANT ALL ON SCHEMA public TO public;');
        console.log('✅ Database cleaned\n');

        // Create migrations tracking table
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Get list of migration files (including 000)
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`Found ${migrationFiles.length} migration files\n`);

        for (const file of migrationFiles) {
            // Check if already executed
            const result = await client.query(
                'SELECT * FROM schema_migrations WHERE migration_name = $1',
                [file]
            );

            if (result.rows.length > 0) {
                console.log(`⏭️  Skipping ${file} (already executed)`);
                continue;
            }

            console.log(`▶️  Running ${file}...`);
            const migrationPath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(migrationPath, 'utf8');

            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
                    [file]
                );
                console.log(`✅ Completed ${file}\n`);
            } catch (error) {
                if (error.code === '42P07') { // Table exists
                    console.log(`⚠️  Table already exists in ${file}, marking as done.`);
                    await client.query(
                        'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
                        [file]
                    );
                } else {
                    console.error(`❌ Error in ${file}:`, error.message);
                    throw error;
                }
            }
        }

        console.log('✨ Database setup completed successfully!');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run setup
runSetup();
