const { validationResult } = require("express-validator");
const User = require("../models/User");
const csv = require("csv-parser");
const { Readable } = require("stream");

/**
 * @desc    Get all users with pagination, search, and filtering
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      isActive = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query object
    const query = {};

    // Search functionality - search in name and email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Role filter
    if (role) {
      query.role = role;
    }

    // Active status filter
    if (isActive !== "") {
      query.isActive = isActive === "true";
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalUsers,
          hasNextPage,
          hasPrevPage,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "GET_USERS_ERROR",
        message: "Failed to retrieve users.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "GET_USER_ERROR",
        message: "Failed to retrieve user.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Create new user
 * @route   POST /api/admin/users
 * @access  Private (Admin only)
 */
const createUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid user information.",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { name, email, password, role, profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: "USER_EXISTS",
          message: "User with this email already exists.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Create user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || "student",
    };

    // Add profile data if provided
    if (profile) {
      userData.profile = {};
      if (profile.phone) userData.profile.phone = profile.phone.trim();
      if (profile.dateOfBirth)
        userData.profile.dateOfBirth = new Date(profile.dateOfBirth);
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "CREATE_USER_ERROR",
        message: "Failed to create user.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin only)
 */
const updateUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid user information.",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { id } = req.params;
    const { name, email, role, profile, isActive } = req.body;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            code: "EMAIL_EXISTS",
            message: "User with this email already exists.",
            timestamp: new Date().toISOString(),
          },
        });
      }
      user.email = email.toLowerCase().trim();
    }

    // Update fields
    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    // Update profile
    if (profile) {
      if (profile.phone !== undefined)
        user.profile.phone = profile.phone.trim();
      if (profile.dateOfBirth)
        user.profile.dateOfBirth = new Date(profile.dateOfBirth);
    }

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully.",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "UPDATE_USER_ERROR",
        message: "Failed to update user.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        error: {
          code: "CANNOT_DELETE_SELF",
          message: "You cannot delete your own account.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: "User deleted successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "DELETE_USER_ERROR",
        message: "Failed to delete user.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Bulk delete users
 * @route   DELETE /api/admin/users/bulk
 * @access  Private (Admin only)
 */
const bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_IDS",
          message: "Please provide an array of user IDs.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Prevent admin from deleting themselves
    const currentUserId = req.user._id.toString();
    if (userIds.includes(currentUserId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "CANNOT_DELETE_SELF",
          message: "You cannot delete your own account.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Soft delete by setting isActive to false
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { isActive: false }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} users deleted successfully.`,
      data: {
        deletedCount: result.modifiedCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Bulk delete users error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "BULK_DELETE_ERROR",
        message: "Failed to delete users.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Bulk update users
 * @route   PUT /api/admin/users/bulk
 * @access  Private (Admin only)
 */
const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, updates } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_IDS",
          message: "Please provide an array of user IDs.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_UPDATES",
          message: "Please provide valid update data.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Build update object (only allow certain fields)
    const allowedUpdates = {};
    if (updates.role) allowedUpdates.role = updates.role;
    if (updates.isActive !== undefined)
      allowedUpdates.isActive = updates.isActive;

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_VALID_UPDATES",
          message: "No valid update fields provided.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      allowedUpdates
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} users updated successfully.`,
      data: {
        updatedCount: result.modifiedCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Bulk update users error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "BULK_UPDATE_ERROR",
        message: "Failed to update users.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};
/**
 * @desc    Import users from CSV
 * @route   POST /api/admin/users/import
 * @access  Private (Admin only)
 */
const importUsersFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_FILE_UPLOADED",
          message: "Please upload a CSV file.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const csvData = req.file.buffer.toString();
    const users = [];
    const errors = [];
    let lineNumber = 1;

    // Parse CSV data
    const stream = Readable.from([csvData]);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (row) => {
          lineNumber++;

          // Validate required fields
          if (!row.name || !row.email || !row.password) {
            errors.push({
              line: lineNumber,
              error: "Missing required fields (name, email, password)",
              data: row,
            });
            return;
          }

          // Validate email format
          const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
          if (!emailRegex.test(row.email)) {
            errors.push({
              line: lineNumber,
              error: "Invalid email format",
              data: row,
            });
            return;
          }

          // Validate role
          const role = row.role || "student";
          if (!["student", "admin"].includes(role)) {
            errors.push({
              line: lineNumber,
              error: "Invalid role (must be 'student' or 'admin')",
              data: row,
            });
            return;
          }

          // Build user object
          const userData = {
            name: row.name.trim(),
            email: row.email.toLowerCase().trim(),
            password: row.password,
            role: role,
            profile: {},
          };

          // Add optional profile fields
          if (row.phone) userData.profile.phone = row.phone.trim();
          if (row.dateOfBirth) {
            const date = new Date(row.dateOfBirth);
            if (!isNaN(date.getTime())) {
              userData.profile.dateOfBirth = date;
            }
          }

          users.push(userData);
        })
        .on("end", async () => {
          try {
            if (errors.length > 0) {
              return res.status(400).json({
                success: false,
                error: {
                  code: "CSV_VALIDATION_ERROR",
                  message: "CSV contains validation errors.",
                  details: errors,
                  timestamp: new Date().toISOString(),
                },
              });
            }

            if (users.length === 0) {
              return res.status(400).json({
                success: false,
                error: {
                  code: "EMPTY_CSV",
                  message: "No valid users found in CSV file.",
                  timestamp: new Date().toISOString(),
                },
              });
            }

            // Check for duplicate emails in CSV
            const emails = users.map((user) => user.email);
            const duplicateEmails = emails.filter(
              (email, index) => emails.indexOf(email) !== index
            );
            if (duplicateEmails.length > 0) {
              return res.status(400).json({
                success: false,
                error: {
                  code: "DUPLICATE_EMAILS_IN_CSV",
                  message: "CSV contains duplicate email addresses.",
                  details: duplicateEmails,
                  timestamp: new Date().toISOString(),
                },
              });
            }

            // Check for existing users in database
            const existingUsers = await User.find({
              email: { $in: emails },
            }).select("email");

            const existingEmails = existingUsers.map((user) => user.email);
            if (existingEmails.length > 0) {
              return res.status(400).json({
                success: false,
                error: {
                  code: "USERS_ALREADY_EXIST",
                  message: "Some users already exist in the database.",
                  details: existingEmails,
                  timestamp: new Date().toISOString(),
                },
              });
            }

            // Create users in bulk
            const createdUsers = await User.insertMany(users);

            res.status(201).json({
              success: true,
              message: `${createdUsers.length} users imported successfully.`,
              data: {
                importedCount: createdUsers.length,
                users: createdUsers.map((user) => user.toJSON()),
              },
              timestamp: new Date().toISOString(),
            });

            resolve();
          } catch (error) {
            console.error("CSV import error:", error);
            res.status(500).json({
              success: false,
              error: {
                code: "IMPORT_ERROR",
                message: "Failed to import users from CSV.",
                details: error.message,
                timestamp: new Date().toISOString(),
              },
            });
            reject(error);
          }
        })
        .on("error", (error) => {
          console.error("CSV parsing error:", error);
          res.status(400).json({
            success: false,
            error: {
              code: "CSV_PARSE_ERROR",
              message: "Failed to parse CSV file.",
              details: error.message,
              timestamp: new Date().toISOString(),
            },
          });
          reject(error);
        });
    });
  } catch (error) {
    console.error("Import users error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "IMPORT_USERS_ERROR",
        message: "Failed to import users.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Export users to CSV
 * @route   GET /api/admin/users/export
 * @access  Private (Admin only)
 */
const exportUsersToCSV = async (req, res) => {
  try {
    const { role = "", isActive = "" } = req.query;

    // Build query object
    const query = {};
    if (role) query.role = role;
    if (isActive !== "") query.isActive = isActive === "true";

    // Get users
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NO_USERS_FOUND",
          message: "No users found matching the criteria.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Convert to CSV format
    const csvHeader =
      "Name,Email,Role,Phone,Date of Birth,Active,Created At,Last Login\n";
    const csvRows = users
      .map((user) => {
        const phone = user.profile?.phone || "";
        const dateOfBirth = user.profile?.dateOfBirth
          ? new Date(user.profile.dateOfBirth).toISOString().split("T")[0]
          : "";
        const createdAt = new Date(user.createdAt).toISOString().split("T")[0];
        const lastLogin = user.lastLogin
          ? new Date(user.lastLogin).toISOString().split("T")[0]
          : "";

        return `"${user.name}","${user.email}","${user.role}","${phone}","${dateOfBirth}","${user.isActive}","${createdAt}","${lastLogin}"`;
      })
      .join("\n");

    const csvContent = csvHeader + csvRows;

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="users_export_${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );

    res.send(csvContent);
  } catch (error) {
    console.error("Export users error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXPORT_USERS_ERROR",
        message: "Failed to export users.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/admin/users/stats
 * @access  Private (Admin only)
 */
const getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      studentCount,
      adminCount,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "admin" }),
      User.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("-password")
        .lean(),
    ]);

    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUserCount = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        studentCount,
        adminCount,
        recentUserCount,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "GET_STATS_ERROR",
        message: "Failed to retrieve user statistics.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  bulkUpdateUsers,
  importUsersFromCSV,
  exportUsersToCSV,
  getUserStats,
};
