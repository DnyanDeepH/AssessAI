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
  Badge,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Quiz,
  Assignment,
  Analytics,
  Logout,
  AccountCircle,
  Notifications,
  AdminPanelSettings,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const drawerWidth = 280;

const AdminLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <Dashboard />,
      path: "/admin",
    },
    {
      text: "User Management",
      icon: <People />,
      path: "/admin/users",
    },
    {
      text: "Question Bank",
      icon: <Quiz />,
      path: "/admin/questions",
    },
    {
      text: "Exam Management",
      icon: <Assignment />,
      path: "/admin/exams",
    },
    {
      text: "Analytics",
      icon: <Analytics />,
      path: "/admin/analytics",
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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
          <AdminPanelSettings />
        </Avatar>
        <Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ fontWeight: "bold" }}
          >
            AssessAI Admin
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Admin Portal
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
                    "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
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
                        : "rgba(102, 126, 234, 0.1)",
                    color:
                      location.pathname === item.path ? "white" : "#667eea",
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
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 2,
              transition: "all 0.3s ease-in-out",
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
            <ListItemIcon sx={{ minWidth: 48 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "rgba(102, 126, 234, 0.1)",
                  color: "#667eea",
                }}
              >
                <AccountCircle />
              </Avatar>
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 2,
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                transform: "translateX(4px)",
                boxShadow: "0 2px 8px rgba(244, 67, 54, 0.2)",
                "& .MuiListItemIcon-root": {
                  color: "#f44336",
                },
                "& .MuiListItemText-primary": {
                  color: "#f44336",
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 48 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "rgba(244, 67, 54, 0.1)",
                  color: "#f44336",
                }}
              >
                <Logout />
              </Avatar>
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.15)",
        }}
      >
        <Toolbar>
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
              Admin Panel
            </Typography>
            <Typography
              variant="caption"
              sx={{
                opacity: 0.8,
                display: { xs: "none", sm: "block" },
              }}
            >
              Management Dashboard
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
                {user?.name || "Admin"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Admin Account
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "white",
                color: "#667eea",
                fontWeight: "bold",
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || "A"}
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
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              borderRight: "1px solid rgba(255, 255, 255, 0.2)",
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
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              borderRight: "1px solid rgba(255, 255, 255, 0.2)",
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
          bgcolor: "grey.50",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
