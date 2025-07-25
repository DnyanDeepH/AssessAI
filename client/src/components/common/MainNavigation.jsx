import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Menu,
  MenuItem,
  IconButton,
  useMediaQuery,
  useTheme,
  Avatar,
  Badge,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  AdminPanelSettings as AdminIcon,
  Psychology as PsychologyIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const MainNavigation = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, isAuthenticated, logout } = useAuth();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = React.useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate("/");
  };

  const navigateTo = (path) => {
    navigate(path);
    handleMenuClose();
  };

  return (
    <AppBar
      position="static"
      elevation={8}
      sx={{
        background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
        boxShadow: "0 4px 20px rgba(25, 118, 210, 0.3)",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ py: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
              cursor: "pointer",
              "&:hover": {
                "& .brand-text": {
                  transform: "scale(1.05)",
                },
              },
            }}
            onClick={() => {
              if (isAuthenticated) {
                if (user?.role === "admin") {
                  navigate("/admin");
                } else if (user?.role === "student") {
                  navigate("/student");
                } else {
                  navigate("/");
                }
              } else {
                navigate("/");
              }
            }}
          >
            <Avatar
              sx={{
                bgcolor: "white",
                color: "primary.main",
                mr: 2,
                width: 40,
                height: 40,
              }}
            >
              <SchoolIcon />
            </Avatar>
            <Typography
              variant="h5"
              component="div"
              className="brand-text"
              sx={{
                fontWeight: "bold",
                color: "white",
                transition: "transform 0.2s ease-in-out",
              }}
            >
              AssessAI
            </Typography>
            {isAuthenticated && user && (
              <Chip
                label={user.role === "admin" ? "Administrator" : "Student"}
                size="small"
                sx={{
                  ml: 2,
                  bgcolor:
                    user.role === "admin" ? "error.main" : "success.main",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            )}
          </Box>

          {isMobile ? (
            <>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                onClick={handleMobileMenuOpen}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={mobileMenuAnchorEl}
                open={Boolean(mobileMenuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    mt: 1,
                    minWidth: 200,
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                  },
                }}
              >
                {!isAuthenticated ? (
                  <>
                    <MenuItem onClick={() => navigateTo("/")} sx={{ py: 1.5 }}>
                      <HomeIcon sx={{ mr: 2, color: "primary.main" }} />
                      Home
                    </MenuItem>
                    <MenuItem
                      onClick={() => navigateTo("/about")}
                      sx={{ py: 1.5 }}
                    >
                      <SchoolIcon sx={{ mr: 2, color: "info.main" }} />
                      About
                    </MenuItem>
                    <MenuItem
                      onClick={() => navigateTo("/login")}
                      sx={{ py: 1.5 }}
                    >
                      <LoginIcon sx={{ mr: 2, color: "success.main" }} />
                      Sign In
                    </MenuItem>
                    <MenuItem
                      onClick={() => navigateTo("/register")}
                      sx={{ py: 1.5 }}
                    >
                      <RegisterIcon sx={{ mr: 2, color: "warning.main" }} />
                      Register
                    </MenuItem>
                  </>
                ) : (
                  <>
                    {user?.role === "student" && (
                      <>
                        <MenuItem
                          onClick={() => navigateTo("/student")}
                          sx={{ py: 1.5 }}
                        >
                          <DashboardIcon
                            sx={{ mr: 2, color: "primary.main" }}
                          />
                          Dashboard
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/student/exams")}
                          sx={{ py: 1.5 }}
                        >
                          <SchoolIcon sx={{ mr: 2, color: "info.main" }} />
                          Exams
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/student/practice")}
                          sx={{ py: 1.5 }}
                        >
                          <PsychologyIcon
                            sx={{ mr: 2, color: "success.main" }}
                          />
                          Practice Zone
                        </MenuItem>
                      </>
                    )}

                    {user?.role === "admin" && (
                      <>
                        <MenuItem
                          onClick={() => navigateTo("/admin")}
                          sx={{ py: 1.5 }}
                        >
                          <AdminIcon sx={{ mr: 2, color: "error.main" }} />
                          Dashboard
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/admin/exams")}
                          sx={{ py: 1.5 }}
                        >
                          <SchoolIcon sx={{ mr: 2, color: "info.main" }} />
                          Exam Management
                        </MenuItem>
                      </>
                    )}

                    <MenuItem
                      onClick={handleLogout}
                      sx={{ py: 1.5, color: "error.main" }}
                    >
                      <LogoutIcon sx={{ mr: 2, color: "error.main" }} />
                      Logout
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          ) : (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {!isAuthenticated ? (
                <>
                  <Button
                    color="inherit"
                    onClick={() => navigateTo("/")}
                    startIcon={<HomeIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    Home
                  </Button>
                  <Button
                    color="inherit"
                    onClick={() => navigateTo("/about")}
                    startIcon={<SchoolIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    About
                  </Button>
                  <Button
                    color="inherit"
                    onClick={() => navigateTo("/login")}
                    startIcon={<LoginIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigateTo("/register")}
                    startIcon={<RegisterIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      bgcolor: "white",
                      color: "primary.main",
                      "&:hover": {
                        bgcolor: "grey.100",
                      },
                    }}
                  >
                    Register
                  </Button>
                </>
              ) : (
                <>
                  {user?.role === "student" && (
                    <Button
                      color="inherit"
                      startIcon={<SchoolIcon />}
                      onClick={handleProfileMenuOpen}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.1)",
                        },
                      }}
                    >
                      Student Portal
                    </Button>
                  )}

                  {user?.role === "admin" && (
                    <Button
                      color="inherit"
                      startIcon={<AdminIcon />}
                      onClick={handleProfileMenuOpen}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.1)",
                        },
                      }}
                    >
                      Admin Panel
                    </Button>
                  )}

                  <Avatar
                    sx={{
                      bgcolor: "white",
                      color: "primary.main",
                      width: 36,
                      height: 36,
                      ml: 1,
                      cursor: "pointer",
                    }}
                    onClick={handleProfileMenuOpen}
                  >
                    <PersonIcon />
                  </Avatar>

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                      sx: {
                        borderRadius: 3,
                        mt: 1,
                        minWidth: 200,
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                      },
                    }}
                  >
                    {user?.role === "student" && (
                      <>
                        <MenuItem
                          onClick={() => navigateTo("/student")}
                          sx={{ py: 1.5 }}
                        >
                          <DashboardIcon
                            sx={{ mr: 2, color: "primary.main" }}
                          />
                          Dashboard
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/student/exams")}
                          sx={{ py: 1.5 }}
                        >
                          <SchoolIcon sx={{ mr: 2, color: "info.main" }} />
                          Exams
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/student/practice")}
                          sx={{ py: 1.5 }}
                        >
                          <PsychologyIcon
                            sx={{ mr: 2, color: "success.main" }}
                          />
                          Practice Zone
                        </MenuItem>
                      </>
                    )}

                    {user?.role === "admin" && (
                      <>
                        <MenuItem
                          onClick={() => navigateTo("/admin")}
                          sx={{ py: 1.5 }}
                        >
                          <AdminIcon sx={{ mr: 2, color: "error.main" }} />
                          Dashboard
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/admin/users")}
                          sx={{ py: 1.5 }}
                        >
                          <PersonIcon sx={{ mr: 2, color: "warning.main" }} />
                          User Management
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/admin/exams")}
                          sx={{ py: 1.5 }}
                        >
                          <SchoolIcon sx={{ mr: 2, color: "info.main" }} />
                          Exam Management
                        </MenuItem>
                      </>
                    )}

                    <MenuItem
                      onClick={handleLogout}
                      sx={{ py: 1.5, color: "error.main" }}
                    >
                      <LogoutIcon sx={{ mr: 2, color: "error.main" }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default MainNavigation;
