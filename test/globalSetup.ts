// Load environment variables BEFORE anything else
require("dotenv").config({ path: ".env.test" });

module.exports = async () => {
  // This runs once before all test suites
  console.log("✓ Test environment initialized with .env.test");
};
