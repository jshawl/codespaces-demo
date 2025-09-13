require("dotenv").config();
const mysql = require("mysql2/promise");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "apppassword",
  database: process.env.DB_NAME || "testdb",
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

async function testConnection() {
  try {
    console.log("Attempting to connect to MySQL database...");
    const connection = await pool.getConnection();
    console.log("✅ Successfully connected to MySQL database!");

    // Test query - fetch all users
    const [rows] = await connection.execute("SELECT * FROM users");
    console.log("\n📊 Users in database:");
    console.table(rows);

    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

async function createUser(name, email) {
  try {
    const [result] = await pool.execute(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email]
    );
    console.log(`✅ User created with ID: ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.error("❌ Error creating user:", error.message);
    throw error;
  }
}

async function getUsers() {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    return rows;
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting Node.js MySQL application...\n");

  // Test database connection
  const isConnected = await testConnection();

  if (isConnected) {
    console.log("\n🔄 Testing database operations...");

    // Create a new user
    try {
      await createUser("Test User", "test@example.com");

      // Fetch and display all users
      const users = await getUsers();
      console.log("\n📋 Updated user list:");
      console.table(users);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        console.log("ℹ️ Test user already exists, skipping creation...");
        const users = await getUsers();
        console.log("\n📋 Current user list:");
        console.table(users);
      }
    }
  }

  // Keep the application running
  console.log("\n✨ Application is running. Press Ctrl+C to exit.");
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    await pool.end();
    process.exit(0);
  });
}

// Export functions for use in other modules
module.exports = {
  pool,
  createUser,
  getUsers,
  testConnection,
};

// Run the main function if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Application error:", error);
    process.exit(1);
  });
}
