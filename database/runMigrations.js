/**
 * Database Migration Runner
 * Runs all migration files in order
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

async function runMigrations() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting database migrations...\n');

        // Create migrations tracking table
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Get list of migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`Found ${migrationFiles.length} migration files\n`);

        for (const file of migrationFiles) {
            // Check if migration already executed
            const result = await client.query(
                'SELECT * FROM schema_migrations WHERE migration_name = $1',
                [file]
            );

            if (result.rows.length > 0) {
                console.log(`⏭️  Skipping ${file} (already executed)`);
                continue;
            }

            console.log(`▶️  Running ${file}...`);

            // Read and execute migration
            const migrationPath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(migrationPath, 'utf8');

            await client.query('BEGIN');

            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                console.log(`✅ Completed ${file}\n`);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error(`❌ Error in ${file}:`, error.message);
                throw error;
            }
        }

        console.log('✨ All migrations completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migrations
runMigrations();
