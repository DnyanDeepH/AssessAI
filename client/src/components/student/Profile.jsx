import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from "@mui/material";
import {
  Person,
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  Lock,
  Email,
  Phone,
  CalendarToday,
  School,
  Assessment,
  TrendingUp,
  Schedule,
  PhotoCamera,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { studentService } from "../../services/studentService";
import { isValidEmail, validatePassword, formatDate } from "../../utils";

const StudentProfile = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileStats, setProfileStats] = useState(null);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
    setValue: setProfileValue,
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.profile?.phone || "",
      dateOfBirth: user?.profile?.dateOfBirth
        ? user.profile.dateOfBirth.split("T")[0]
        : "",
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm();

  const newPassword = watchPassword("newPassword");

  useEffect(() => {
    fetchProfileStats();
  }, []);

  useEffect(() => {
    // Update form values when user data changes
    if (user) {
      setProfileValue("name", user.name || "");
      setProfileValue("email", user.email || "");
      setProfileValue("phone", user.profile?.phone || "");
      setProfileValue(
        "dateOfBirth",
        user.profile?.dateOfBirth ? user.profile.dateOfBirth.split("T")[0] : ""
      );
    }
  }, [user, setProfileValue]);

  const fetchProfileStats = async () => {
    try {
      const response = await studentService.getDashboard();
      if (response.success) {
        setProfileStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile stats:", err);
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const response = await studentService.updateProfile(data);
      if (response.success) {
        setSuccess("Profile updated successfully!");
        setEditMode(false);

        // Update auth context with new user data
        const updatedUser = { ...user, ...response.data.user };
        // Note: In a real app, you might want to refresh the token or update the context properly

        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const response = await studentService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.success) {
        setSuccess("Password changed successfully!");
        setPasswordDialogOpen(false);
        resetPassword();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    resetProfile({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.profile?.phone || "",
      dateOfBirth: user?.profile?.dateOfBirth
        ? user.profile.dateOfBirth.split("T")[0]
        : "",
    });
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          my: 4,
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          py: 4,
          px: 2,
          borderRadius: 0,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="25" cy="75" r="1" fill="%23ffffff" opacity="0.05"/><circle cx="75" cy="25" r="1" fill="%23ffffff" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>\') repeat',
            opacity: 0.4,
            pointerEvents: "none",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            p: 4,
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                mr: 2,
                width: 48,
                height: 48,
                background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
              }}
            >
              <Person />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1,
                }}
              >
                My Profile
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              >
                Manage your account settings and view your academic progress
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Success/Error Messages */}
        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              background:
                "linear-gradient(135deg, rgba(76, 175, 80, 0.9) 0%, rgba(129, 199, 132, 0.8) 100%)",
              backdropFilter: "blur(10px)",
              borderRadius: 2,
              border: "1px solid rgba(76, 175, 80, 0.3)",
              color: "white",
              "& .MuiAlert-icon": {
                color: "white",
              },
            }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              background:
                "linear-gradient(135deg, rgba(244, 67, 54, 0.9) 0%, rgba(229, 115, 115, 0.8) 100%)",
              backdropFilter: "blur(10px)",
              borderRadius: 2,
              border: "1px solid rgba(244, 67, 54, 0.3)",
              color: "white",
              "& .MuiAlert-icon": {
                color: "white",
              },
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 4 }}>
                <Box
                  sx={{ position: "relative", display: "inline-block", mb: 3 }}
                >
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      mx: "auto",
                      background:
                        "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                      fontSize: "3rem",
                      boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Avatar>
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      bgcolor: "rgba(255,255,255,0.9)",
                      borderRadius: "50%",
                      p: 1,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 20, color: "#667eea" }} />
                  </Box>
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    color: "text.primary",
                    mb: 1,
                  }}
                >
                  {user?.name}
                </Typography>

                <Chip
                  label={user?.role?.toUpperCase()}
                  sx={{
                    background:
                      "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                    color: "white",
                    fontWeight: "bold",
                    mb: 2,
                    "& .MuiChip-label": {
                      px: 2,
                    },
                  }}
                />

                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    mb: 3,
                    fontWeight: 500,
                  }}
                >
                  Member since {formatDate(user?.createdAt)}
                </Typography>

                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  size="small"
                  disabled
                  sx={{
                    borderColor: "#667eea",
                    color: "#667eea",
                    borderRadius: 2,
                    px: 3,
                    "&:hover": {
                      borderColor: "#764ba2",
                      backgroundColor: "rgba(102, 126, 234, 0.05)",
                    },
                  }}
                >
                  Change Photo
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {profileStats && (
              <Card
                elevation={0}
                sx={{
                  mt: 3,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: "bold",
                      background:
                        "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Quick Stats
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: "rgba(33, 150, 243, 0.1)",
                            color: "#2196f3",
                            width: 40,
                            height: 40,
                          }}
                        >
                          <Assessment />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            Completed Exams
                          </Typography>
                        }
                        secondary={
                          <Typography
                            sx={{
                              color: "#2196f3",
                              fontWeight: "bold",
                              fontSize: "1.1rem",
                            }}
                          >
                            {profileStats.completedExamsCount || 0}
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: "rgba(76, 175, 80, 0.1)",
                            color: "#4caf50",
                            width: 40,
                            height: 40,
                          }}
                        >
                          <TrendingUp />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            Average Score
                          </Typography>
                        }
                        secondary={
                          <Typography
                            sx={{
                              color: "#4caf50",
                              fontWeight: "bold",
                              fontSize: "1.1rem",
                            }}
                          >
                            {profileStats.averageScore
                              ? `${profileStats.averageScore}%`
                              : "N/A"}
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: "rgba(255, 152, 0, 0.1)",
                            color: "#ff9800",
                            width: 40,
                            height: 40,
                          }}
                        >
                          <Schedule />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            Upcoming Exams
                          </Typography>
                        }
                        secondary={
                          <Typography
                            sx={{
                              color: "#ff9800",
                              fontWeight: "bold",
                              fontSize: "1.1rem",
                            }}
                          >
                            {profileStats.upcomingExamsCount || 0}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Card
              elevation={0}
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                overflow: "hidden",
              }}
            >
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  background:
                    "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                  "& .MuiTab-root": {
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1rem",
                    "&.Mui-selected": {
                      color: "white",
                    },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "white",
                    height: 3,
                    borderRadius: "3px 3px 0 0",
                  },
                }}
              >
                <Tab label="Personal Information" />
                <Tab label="Account Settings" />
              </Tabs>

              {/* Personal Information Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 4,
                      pb: 2,
                      borderBottom: "2px solid rgba(102, 126, 234, 0.1)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        background:
                          "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Personal Information
                    </Typography>
                    {!editMode ? (
                      <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => setEditMode(true)}
                        sx={{
                          background:
                            "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                          boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                          borderRadius: 2,
                          px: 3,
                          "&:hover": {
                            background:
                              "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 16px rgba(102, 126, 234, 0.4)",
                          },
                          transition: "all 0.3s ease",
                        }}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancelEdit}
                          sx={{
                            borderColor: "#f44336",
                            color: "#f44336",
                            borderRadius: 2,
                            "&:hover": {
                              borderColor: "#d32f2f",
                              backgroundColor: "rgba(244, 67, 54, 0.05)",
                            },
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleProfileSubmit(onProfileSubmit)}
                          disabled={loading}
                          sx={{
                            background:
                              "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)",
                            boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                            borderRadius: 2,
                            "&:hover": {
                              background:
                                "linear-gradient(45deg, #388e3c 30%, #4caf50 90%)",
                            },
                          }}
                        >
                          {loading ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          disabled={!editMode}
                          {...registerProfile("name", {
                            required: "Name is required",
                            minLength: {
                              value: 2,
                              message: "Name must be at least 2 characters",
                            },
                          })}
                          error={!!profileErrors.name}
                          helperText={profileErrors.name?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person sx={{ color: "#667eea" }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: editMode
                                ? "rgba(255, 255, 255, 0.8)"
                                : "rgba(0, 0, 0, 0.05)",
                              borderRadius: 2,
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#667eea",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                  borderColor: "#667eea",
                                },
                            },
                            "& .MuiInputLabel-root": {
                              "&.Mui-focused": {
                                color: "#667eea",
                              },
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          type="email"
                          disabled={!editMode}
                          {...registerProfile("email", {
                            required: "Email is required",
                            validate: (value) =>
                              isValidEmail(value) ||
                              "Please enter a valid email address",
                          })}
                          error={!!profileErrors.email}
                          helperText={profileErrors.email?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email sx={{ color: "#667eea" }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: editMode
                                ? "rgba(255, 255, 255, 0.8)"
                                : "rgba(0, 0, 0, 0.05)",
                              borderRadius: 2,
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#667eea",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                  borderColor: "#667eea",
                                },
                            },
                            "& .MuiInputLabel-root": {
                              "&.Mui-focused": {
                                color: "#667eea",
                              },
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          disabled={!editMode}
                          {...registerProfile("phone")}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone sx={{ color: "#667eea" }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: editMode
                                ? "rgba(255, 255, 255, 0.8)"
                                : "rgba(0, 0, 0, 0.05)",
                              borderRadius: 2,
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#667eea",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                  borderColor: "#667eea",
                                },
                            },
                            "& .MuiInputLabel-root": {
                              "&.Mui-focused": {
                                color: "#667eea",
                              },
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Date of Birth"
                          type="date"
                          disabled={!editMode}
                          {...registerProfile("dateOfBirth")}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarToday sx={{ color: "#667eea" }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: editMode
                                ? "rgba(255, 255, 255, 0.8)"
                                : "rgba(0, 0, 0, 0.05)",
                              borderRadius: 2,
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#667eea",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                  borderColor: "#667eea",
                                },
                            },
                            "& .MuiInputLabel-root": {
                              "&.Mui-focused": {
                                color: "#667eea",
                              },
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </form>
                </Box>
              </TabPanel>

              {/* Account Settings Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 3,
                      fontWeight: "bold",
                      background:
                        "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      pb: 2,
                      borderBottom: "2px solid rgba(102, 126, 234, 0.1)",
                    }}
                  >
                    Account Settings
                  </Typography>

                  <List
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.5)",
                      borderRadius: 2,
                    }}
                  >
                    <ListItem
                      sx={{
                        py: 3,
                        borderRadius: 2,
                        mb: 1,
                        "&:hover": {
                          backgroundColor: "rgba(102, 126, 234, 0.05)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: "rgba(76, 175, 80, 0.1)",
                            color: "#4caf50",
                            width: 48,
                            height: 48,
                          }}
                        >
                          <Lock />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                              mb: 0.5,
                            }}
                          >
                            Password
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ color: "text.secondary" }}>
                            Change your account password for better security
                          </Typography>
                        }
                      />
                      <Button
                        variant="contained"
                        onClick={() => setPasswordDialogOpen(true)}
                        sx={{
                          background:
                            "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)",
                          boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                          borderRadius: 2,
                          px: 3,
                          "&:hover": {
                            background:
                              "linear-gradient(45deg, #388e3c 30%, #4caf50 90%)",
                            transform: "translateY(-2px)",
                          },
                          transition: "all 0.3s ease",
                        }}
                      >
                        Change Password
                      </Button>
                    </ListItem>
                    <Divider sx={{ my: 1 }} />
                    <ListItem
                      sx={{
                        py: 3,
                        borderRadius: 2,
                        mb: 1,
                        "&:hover": {
                          backgroundColor: "rgba(102, 126, 234, 0.05)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: "rgba(33, 150, 243, 0.1)",
                            color: "#2196f3",
                            width: 48,
                            height: 48,
                          }}
                        >
                          <Email />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                              mb: 0.5,
                            }}
                          >
                            Email Notifications
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ color: "text.secondary" }}>
                            Manage your email preferences and notifications
                          </Typography>
                        }
                      />
                      <Button
                        variant="outlined"
                        disabled
                        sx={{
                          borderColor: "rgba(0,0,0,0.12)",
                          color: "rgba(0,0,0,0.26)",
                          borderRadius: 2,
                          px: 3,
                        }}
                      >
                        Configure
                      </Button>
                    </ListItem>
                    <Divider sx={{ my: 1 }} />
                    <ListItem
                      sx={{
                        py: 3,
                        borderRadius: 2,
                        "&:hover": {
                          backgroundColor: "rgba(102, 126, 234, 0.05)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: "rgba(102, 126, 234, 0.1)",
                            color: "#667eea",
                            width: 48,
                            height: 48,
                          }}
                        >
                          <School />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                              mb: 0.5,
                            }}
                          >
                            Account Type
                          </Typography>
                        }
                        secondary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            <Typography sx={{ color: "text.secondary" }}>
                              Current role:
                            </Typography>
                            <Chip
                              label={user?.role?.toUpperCase()}
                              sx={{
                                background:
                                  "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                                color: "white",
                                fontWeight: "bold",
                                fontSize: "0.75rem",
                              }}
                              size="small"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  </List>
                </Box>
              </TabPanel>
            </Card>
          </Grid>
        </Grid>

        {/* Change Password Dialog */}
        <Dialog
          open={passwordDialogOpen}
          onClose={() => setPasswordDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              borderRadius: 3,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 8px 32px rgba(102, 126, 234, 0.1)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
              py: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  width: 40,
                  height: 40,
                }}
              >
                <Lock />
              </Avatar>
              Change Password
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showCurrentPassword ? "text" : "password"}
                    {...registerPassword("currentPassword", {
                      required: "Current password is required",
                    })}
                    error={!!passwordErrors.currentPassword}
                    helperText={passwordErrors.currentPassword?.message}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        background: "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(10px)",
                        borderRadius: 2,
                        "& fieldset": {
                          borderColor: "rgba(102, 126, 234, 0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(102, 126, 234, 0.5)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#667eea",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "rgba(0, 0, 0, 0.7)",
                        "&.Mui-focused": {
                          color: "#667eea",
                        },
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            edge="end"
                            sx={{
                              color: "#667eea",
                              "&:hover": {
                                backgroundColor: "rgba(102, 126, 234, 0.1)",
                              },
                            }}
                          >
                            {showCurrentPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showNewPassword ? "text" : "password"}
                    {...registerPassword("newPassword", {
                      required: "New password is required",
                      validate: (value) => {
                        const validation = validatePassword(value);
                        return validation.isValid || validation.message;
                      },
                    })}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword?.message}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        background: "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(10px)",
                        borderRadius: 2,
                        "& fieldset": {
                          borderColor: "rgba(102, 126, 234, 0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(102, 126, 234, 0.5)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#667eea",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "rgba(0, 0, 0, 0.7)",
                        "&.Mui-focused": {
                          color: "#667eea",
                        },
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            sx={{
                              color: "#667eea",
                              "&:hover": {
                                backgroundColor: "rgba(102, 126, 234, 0.1)",
                              },
                            }}
                          >
                            {showNewPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showConfirmPassword ? "text" : "password"}
                    {...registerPassword("confirmPassword", {
                      required: "Please confirm your new password",
                      validate: (value) =>
                        value === newPassword || "Passwords do not match",
                    })}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword?.message}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        background: "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(10px)",
                        borderRadius: 2,
                        "& fieldset": {
                          borderColor: "rgba(102, 126, 234, 0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(102, 126, 234, 0.5)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#667eea",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "rgba(0, 0, 0, 0.7)",
                        "&.Mui-focused": {
                          color: "#667eea",
                        },
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            edge="end"
                            sx={{
                              color: "#667eea",
                              "&:hover": {
                                backgroundColor: "rgba(102, 126, 234, 0.1)",
                              },
                            }}
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 4, gap: 2 }}>
            <Button
              onClick={() => setPasswordDialogOpen(false)}
              variant="outlined"
              sx={{
                borderColor: "rgba(102, 126, 234, 0.3)",
                color: "#667eea",
                borderRadius: 2,
                px: 3,
                "&:hover": {
                  borderColor: "#667eea",
                  backgroundColor: "rgba(102, 126, 234, 0.05)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordSubmit(onPasswordSubmit)}
              variant="contained"
              disabled={loading}
              sx={{
                background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                borderRadius: 2,
                px: 3,
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
                  transform: "translateY(-2px)",
                },
                "&:disabled": {
                  background: "rgba(0, 0, 0, 0.12)",
                  color: "rgba(0, 0, 0, 0.26)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default StudentProfile;
