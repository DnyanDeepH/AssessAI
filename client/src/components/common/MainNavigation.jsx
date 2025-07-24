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
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const MainNavigation = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, isAuthenticated, logout } = useAuth();

  // Debug authentication state
  console.log("MainNavigation: isAuthenticated =", isAuthenticated);
  console.log("MainNavigation: user =", user);

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
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: "pointer" }}
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
            AssessAI
          </Typography>

          {isMobile ? (
            <>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                onClick={handleMobileMenuOpen}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={mobileMenuAnchorEl}
                open={Boolean(mobileMenuAnchorEl)}
                onClose={handleMenuClose}
              >
                {!isAuthenticated && (
                  <>
                    <MenuItem onClick={() => navigateTo("/")}>Home</MenuItem>
                    <MenuItem onClick={() => navigateTo("/about")}>
                      About
                    </MenuItem>
                  </>
                )}

                {!isAuthenticated ? (
                  <>
                    <MenuItem onClick={() => navigateTo("/login")}>
                      Login
                    </MenuItem>
                    <MenuItem onClick={() => navigateTo("/register")}>
                      Register
                    </MenuItem>
                  </>
                ) : (
                  <>
                    {user?.role === "student" && (
                      <>
                        <MenuItem onClick={() => navigateTo("/student")}>
                          Dashboard
                        </MenuItem>
                        <MenuItem onClick={() => navigateTo("/student/exams")}>
                          Exams
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/student/practice")}
                        >
                          Practice Zone
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/student/profile")}
                        >
                          Profile
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/student/results")}
                        >
                          Results
                        </MenuItem>
                      </>
                    )}

                    {user?.role === "admin" && (
                      <>
                        <MenuItem onClick={() => navigateTo("/admin")}>
                          Admin Dashboard
                        </MenuItem>
                        <MenuItem onClick={() => navigateTo("/admin/users")}>
                          User Management
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/admin/questions")}
                        >
                          Question Bank
                        </MenuItem>
                        <MenuItem onClick={() => navigateTo("/admin/exams")}>
                          Exam Management
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/admin/analytics")}
                        >
                          Analytics
                        </MenuItem>
                      </>
                    )}

                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </>
                )}
              </Menu>
            </>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              {!isAuthenticated && (
                <>
                  <Button color="inherit" onClick={() => navigateTo("/")}>
                    Home
                  </Button>
                  <Button color="inherit" onClick={() => navigateTo("/about")}>
                    About
                  </Button>
                </>
              )}

              {!isAuthenticated ? (
                <>
                  <Button color="inherit" onClick={() => navigateTo("/login")}>
                    Login
                  </Button>
                  <Button
                    color="inherit"
                    variant="outlined"
                    onClick={() => navigateTo("/register")}
                    sx={{ ml: 1 }}
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
                    >
                      Student
                    </Button>
                  )}

                  {user?.role === "admin" && (
                    <Button
                      color="inherit"
                      startIcon={<DashboardIcon />}
                      onClick={handleProfileMenuOpen}
                    >
                      Admin
                    </Button>
                  )}

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    {user?.role === "student" && (
                      <>
                        <MenuItem onClick={() => navigateTo("/student")}>
                          Dashboard
                        </MenuItem>
                        <MenuItem onClick={() => navigateTo("/student/exams")}>
                          Exams
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/student/practice")}
                        >
                          Practice Zone
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/student/profile")}
                        >
                          Profile
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/student/results")}
                        >
                          Results
                        </MenuItem>
                      </>
                    )}

                    {user?.role === "admin" && (
                      <>
                        <MenuItem onClick={() => navigateTo("/admin")}>
                          Dashboard
                        </MenuItem>
                        <MenuItem onClick={() => navigateTo("/admin/users")}>
                          User Management
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/admin/questions")}
                        >
                          Question Bank
                        </MenuItem>
                        <MenuItem onClick={() => navigateTo("/admin/exams")}>
                          Exam Management
                        </MenuItem>
                        <MenuItem
                          onClick={() => navigateTo("/admin/analytics")}
                        >
                          Analytics
                        </MenuItem>
                      </>
                    )}

                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
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
