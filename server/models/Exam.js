const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
      minlength: [3, "Exam title must be at least 3 characters long"],
      maxlength: [200, "Exam title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    durationInMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
      max: [480, "Duration cannot exceed 8 hours (480 minutes)"],
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
    ],
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    settings: {
      shuffleQuestions: {
        type: Boolean,
        default: false,
      },
      shuffleOptions: {
        type: Boolean,
        default: false,
      },
      showResults: {
        type: Boolean,
        default: true,
      },
      allowReview: {
        type: Boolean,
        default: false,
      },
      maxAttempts: {
        type: Number,
        default: 1,
        min: [1, "Maximum attempts must be at least 1"],
      },
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
examSchema.index({ startTime: 1, endTime: 1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ isActive: 1 });
examSchema.index({ assignedTo: 1 });

// Validation for time window
examSchema.pre("save", function (next) {
  if (this.startTime && this.endTime) {
    if (this.startTime >= this.endTime) {
      return next(new Error("Start time must be before end time"));
    }

    // Ensure exam window is reasonable (at least the duration)
    const windowDuration = (this.endTime - this.startTime) / (1000 * 60); // in minutes

    if (windowDuration < this.durationInMinutes) {
      return next(
        new Error(
          `Exam window must be at least ${this.durationInMinutes} minutes (exam duration)`
        )
      );
    }
  }
  next();
});

// Static method to find active exams
examSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, isActive: true });
};

// Static method to find upcoming exams for a student
examSchema.statics.findUpcomingForStudent = function (studentId) {
  const now = new Date();
  return this.find({
    assignedTo: studentId,
    startTime: { $lte: now },
    endTime: { $gte: now },
    isActive: true,
  }).populate("questions", "questionText topic difficulty");
};

// Static method to find past exams for a student
examSchema.statics.findPastForStudent = function (studentId) {
  const now = new Date();
  return this.find({
    assignedTo: studentId,
    endTime: { $lt: now },
    isActive: true,
  }).populate("questions", "questionText topic difficulty");
};

// Instance method to check if exam is currently active
examSchema.methods.isCurrentlyActive = function () {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now && this.isActive;
};

// Instance method to check if exam has started
examSchema.methods.hasStarted = function () {
  const now = new Date();
  return this.startTime <= now;
};

// Instance method to check if exam has ended
examSchema.methods.hasEnded = function () {
  const now = new Date();
  return this.endTime < now;
};

// Instance method to get exam status
examSchema.methods.getStatus = function () {
  const now = new Date();

  if (!this.isActive) return "inactive";
  if (now < this.startTime) return "upcoming";
  if (now >= this.startTime && now <= this.endTime) return "active";
  if (now > this.endTime) return "ended";
};

// Instance method to populate questions and assigned users
examSchema.methods.populateDetails = function () {
  return this.populate([
    {
      path: "questions",
      select: "questionText options correctAnswer topic difficulty",
      match: { isActive: true },
    },
    {
      path: "assignedTo",
      select: "name email profile.avatar",
    },
    {
      path: "createdBy",
      select: "name email",
    },
  ]);
};

// Instance method for soft delete
examSchema.methods.softDelete = function () {
  this.isActive = false;
  return this.save();
};

// Instance method to assign students
examSchema.methods.assignStudents = function (studentIds) {
  // Add new student IDs while avoiding duplicates
  const currentIds = this.assignedTo.map((id) => id.toString());
  const newIds = studentIds.filter((id) => !currentIds.includes(id.toString()));
  this.assignedTo.push(...newIds);
  return this.save();
};

// Instance method to unassign students
examSchema.methods.unassignStudents = function (studentIds) {
  this.assignedTo = this.assignedTo.filter(
    (id) =>
      !studentIds.some((removeId) => removeId.toString() === id.toString())
  );
  return this.save();
};

module.exports = mongoose.model("Exam", examSchema);
