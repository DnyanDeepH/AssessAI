const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      minlength: [10, "Question text must be at least 10 characters long"],
      maxlength: [1000, "Question text cannot exceed 1000 characters"],
    },
    options: {
      type: [String],
      required: [true, "Options are required"],
      validate: {
        validator: function (options) {
          return options && options.length === 4;
        },
        message: "Question must have exactly 4 options",
      },
    },
    correctAnswer: {
      type: String,
      required: [true, "Correct answer is required"],
      validate: {
        validator: function (answer) {
          return this.options && this.options.includes(answer);
        },
        message: "Correct answer must be one of the provided options",
      },
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
      maxlength: [100, "Topic cannot exceed 100 characters"],
    },
    difficulty: {
      type: String,
      enum: {
        values: ["easy", "medium", "hard"],
        message: "Difficulty must be easy, medium, or hard",
      },
      default: "medium",
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [500, "Explanation cannot exceed 500 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
questionSchema.index({ topic: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ createdBy: 1 });

// Static method to find active questions
questionSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, isActive: true });
};

// Static method to find by topic
questionSchema.statics.findByTopic = function (topic) {
  return this.find({ topic, isActive: true });
};

// Static method to find by difficulty
questionSchema.statics.findByDifficulty = function (difficulty) {
  return this.find({ difficulty, isActive: true });
};

// Instance method for soft delete
questionSchema.methods.softDelete = function () {
  this.isActive = false;
  return this.save();
};

// Instance method to restore
questionSchema.methods.restore = function () {
  this.isActive = true;
  return this.save();
};

// Pre-save validation to ensure options are trimmed and not empty
questionSchema.pre("save", function (next) {
  if (this.options) {
    this.options = this.options
      .map((option) => option.trim())
      .filter((option) => option.length > 0);

    if (this.options.length !== 4) {
      return next(new Error("Question must have exactly 4 non-empty options"));
    }

    // Check for duplicate options
    const uniqueOptions = [...new Set(this.options)];
    if (uniqueOptions.length !== 4) {
      return next(new Error("All options must be unique"));
    }
  }
  next();
});

module.exports = mongoose.model("Question", questionSchema);
