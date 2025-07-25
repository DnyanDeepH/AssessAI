import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Quiz,
  Psychology,
  Assignment,
  Person,
  TrendingUp,
  Logout,
  AccountCircle,
  Notifications,
  Home,
  School,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const drawerWidth = 280;

const StudentLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate("/");
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <Dashboard />,
      path: "/student",
    },
    {
      text: "Exams",
      icon: <Assignment />,
      path: "/student/exams",
    },
    {
      text: "AI Practice Zone",
      icon: <Psychology />,
      path: "/student/practice",
    },
    {
      text: "Results",
      icon: <TrendingUp />,
      path: "/student/results",
    },
    {
      text: "Profile",
      icon: <Person />,
      path: "/student/profile",
    },
  ];

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          py: 2,
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Avatar
          sx={{
            bgcolor: "white",
            color: "primary.main",
            mr: 2,
            width: 40,
            height: 40,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <School />
        </Avatar>
        <Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ fontWeight: "bold" }}
          >
            Student Portal
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            AssessAI Platform
          </Typography>
        </Box>

        {/* Decorative Background Element */}
        <Box
          sx={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.1)",
            zIndex: 0,
          }}
        />
      </Toolbar>
      <Divider sx={{ bgcolor: "rgba(0,0,0,0.1)" }} />
      <List sx={{ p: 2 }}>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                borderRadius: 3,
                py: 1.5,
                px: 2,
                transition: "all 0.3s ease-in-out",
                "&.Mui-selected": {
                  background:
                    "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                  transform: "translateX(8px)",
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                  "& .MuiListItemText-primary": {
                    fontWeight: 600,
                  },
                },
                "&:hover": {
                  backgroundColor: "rgba(102, 126, 234, 0.1)",
                  transform: "translateX(4px)",
                  boxShadow: "0 2px 8px rgba(102, 126, 234, 0.2)",
                  "& .MuiListItemIcon-root": {
                    color: "#667eea",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path
                      ? "inherit"
                      : "text.secondary",
                  minWidth: 48,
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor:
                      location.pathname === item.path
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(25, 118, 210, 0.1)",
                    color:
                      location.pathname === item.path
                        ? "white"
                        : "primary.main",
                  }}
                >
                  {item.icon}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ bgcolor: "rgba(0,0,0,0.1)", mx: 2 }} />
      <List sx={{ p: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 2,
              color: "error.main",
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                backgroundColor: "rgba(244, 67, 54, 0.26)",
                transform: "translateX(4px)",
                color: "error.main",
                "& .MuiListItemIcon-root": {
                  color: "error.main",
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 48 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "rgba(244, 67, 54, 0.25)",
                  color: "error.main",
                }}
              >
                <Logout />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        elevation={8}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          boxShadow: "0 4px 20px rgba(25, 118, 210, 0.3)",
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { md: "none" },
              bgcolor: "rgba(255, 255, 255, 0.1)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: "bold",
                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              AssessAI
            </Typography>
            <Typography
              variant="caption"
              sx={{
                opacity: 0.8,
                display: { xs: "none", sm: "block" },
              }}
            >
              Student Learning Dashboard
            </Typography>
          </Box>

          {/* Notifications */}
          <IconButton
            size="large"
            color="inherit"
            sx={{
              mr: 2,
              bgcolor: "rgba(255, 255, 255, 0.1)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Profile Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name || "Student"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Student Account
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "white",
                color: "primary.main",
                fontWeight: "bold",
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || "S"}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundImage: "none",
              bgcolor: "background.paper",
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundImage: "none",
              bgcolor: "background.paper",
              borderRight: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          bgcolor: "#f5f7fa",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, position: "relative" }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default StudentLayout;
