const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("../models/User");
const Question = require("../models/Question");
const Exam = require("../models/Exam");

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔗 Connected to MongoDB Atlas");

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Question.deleteMany({});
    // await Exam.deleteMany({});
    // console.log('🧹 Cleared existing data');

    // Create Admin User
    const existingAdmin = await User.findOne({ email: "admin@assessai.com" });
    if (!existingAdmin) {
      const adminUser = new User({
        name: "System Administrator",
        email: "admin@assessai.com",
        password: "Admin123!",
        role: "admin",
        isActive: true,
        profile: {
          avatar: "",
          phone: "+1-555-0100",
          dateOfBirth: null,
        },
      });
      await adminUser.save();
      console.log("✅ Admin user created");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Create Test Student Users
    const studentEmails = [
      "student1@test.com",
      "student2@test.com",
      "john.doe@student.com",
    ];

    for (let i = 0; i < studentEmails.length; i++) {
      const email = studentEmails[i];
      const existingStudent = await User.findOne({ email });

      if (!existingStudent) {
        const studentUser = new User({
          name: `Test Student ${i + 1}`,
          email: email,
          password: "Student123!",
          role: "student",
          isActive: true,
          profile: {
            avatar: "",
            phone: `+1-555-010${i + 1}`,
            dateOfBirth: new Date("2000-01-01"),
          },
        });
        await studentUser.save();
        console.log(`✅ Student user created: ${email}`);
      }
    }

    // Create Sample Questions
    const sampleQuestions = [
      {
        questionText: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: "Paris",
        topic: "Geography",
        difficulty: "easy",
        explanation: "Paris is the capital and largest city of France.",
        isActive: true,
      },
      {
        questionText:
          "Which programming language is known as the 'language of the web'?",
        options: ["Python", "JavaScript", "Java", "C++"],
        correctAnswer: "JavaScript",
        topic: "Programming",
        difficulty: "medium",
        explanation:
          "JavaScript is widely used for web development and is often called the language of the web.",
        isActive: true,
      },
      {
        questionText: "What is the time complexity of binary search?",
        options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correctAnswer: "O(log n)",
        topic: "Computer Science",
        difficulty: "hard",
        explanation:
          "Binary search has a time complexity of O(log n) because it eliminates half of the search space in each iteration.",
        isActive: true,
      },
    ];

    for (const questionData of sampleQuestions) {
      const existingQuestion = await Question.findOne({
        questionText: questionData.questionText,
      });
      if (!existingQuestion) {
        const question = new Question(questionData);
        await question.save();
        console.log(`✅ Question created: ${questionData.topic}`);
      }
    }

    // Create Sample Exam
    const questions = await Question.find({ isActive: true }).limit(3);
    const students = await User.find({ role: "student" });

    if (questions.length > 0 && students.length > 0) {
      const existingExam = await Exam.findOne({ title: "Sample Assessment" });
      if (!existingExam) {
        const sampleExam = new Exam({
          title: "Sample Assessment",
          description: "A sample exam to test the system functionality",
          questions: questions.map((q) => q._id),
          durationInMinutes: 30,
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
          assignedTo: students.map((s) => s._id),
          settings: {
            shuffleQuestions: true,
            shuffleOptions: true,
            showResultsImmediately: true,
            allowReview: true,
            maxAttempts: 1,
            passingScore: 60,
          },
          isActive: true,
        });
        await sampleExam.save();
        console.log("✅ Sample exam created and assigned to all students");
      }
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("👨‍💼 Admin:");
    console.log("   Email: admin@assessai.com");
    console.log("   Password: Admin123!");
    console.log("\n👨‍🎓 Students:");
    studentEmails.forEach((email) => {
      console.log(`   Email: ${email}`);
      console.log("   Password: Student123!");
    });
    console.log("\n🚀 You can now login and test the application!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
seedDatabase();
