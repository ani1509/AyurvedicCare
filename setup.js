const fs = require("fs");
const path = require("path");

console.log("🚀 Setting up Ayurvedic Consultation Platform...\n");

// Check if .env file exists
const envPath = path.join(__dirname, "server", ".env");
if (!fs.existsSync(envPath)) {
  console.log("📝 Creating .env file...");
  const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/ayurvedic_platform
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development`;

  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env file created successfully");
} else {
  console.log("✅ .env file already exists");
}

console.log("\n📋 Next steps:");
console.log("1. Install dependencies: npm run install-all");
console.log("2. Start MongoDB service");
console.log("3. Run the application: npm run dev");
console.log("\n🌐 Access the application:");
console.log("   Frontend: http://localhost:3000");
console.log("   Backend API: http://localhost:5000");
console.log("\n📚 For more information, check the README.md file");
