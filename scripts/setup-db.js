const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Load environment variables from root .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.NEON_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: NEON_DB_URL or DATABASE_URL is not set in the .env file.");
  process.exit(1);
}

console.log("Connecting to Neon Postgres...");
const sql = neon(connectionString);

// Helper function to split SQL file by semicolons, ignoring comments and executing individually
async function executeSqlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Basic SQL parser: split by semicolon while ignoring comments
  const lines = content.split('\n');
  let cleanedContent = '';
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.startsWith('//')) {
      continue; // Ignore comment lines
    }
    cleanedContent += line + '\n';
  }
  
  // Split by semicolon, filter out empty queries
  const statements = cleanedContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
    
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await sql.query(stmt);
    } catch (err) {
      console.error(`Error executing statement #${i + 1}:`);
      console.error(stmt);
      throw err;
    }
  }
}

async function run() {
  try {
    const schemaPath = path.join(__dirname, '../sql/schema.sql');
    const seedPath = path.join(__dirname, '../sql/seed.sql');

    console.log("Reading and executing schema.sql...");
    await executeSqlFile(schemaPath);
    console.log("Schema created successfully.");

    console.log("Reading and executing seed.sql...");
    await executeSqlFile(seedPath);
    console.log("Seed data loaded successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

run();
