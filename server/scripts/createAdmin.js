const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import User model
const User = require("../models/User");

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@assessai.com" });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email: admin@assessai.com");
      console.log("You can use this account to login.");
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: "System Administrator",
      email: "admin@assessai.com",
      password: "Admin123!", // This will be hashed by the User model
      role: "admin",
      isActive: true,
      profile: {
        avatar: "",
        phone: "",
        dateOfBirth: null,
      },
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@assessai.com");
    console.log("🔑 Password: Admin123!");
    console.log("");
    console.log("You can now login to the admin panel with these credentials.");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
createAdminUser();
