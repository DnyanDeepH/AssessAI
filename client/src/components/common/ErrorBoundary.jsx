import React from "react";
import { Box, Typography, Button, Paper, Alert } from "@mui/material";
import { Refresh, Home } from "@mui/icons-material";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{ p: 4, maxWidth: 600, textAlign: "center" }}
          >
            <Typography variant="h4" gutterBottom color="error">
              Oops! Something went wrong
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
              <Typography variant="body2">
                <strong>Error:</strong>{" "}
                {this.state.error && this.state.error.toString()}
              </Typography>
            </Alert>

            <Typography variant="body1" paragraph>
              Don't worry! This is likely due to missing data or a temporary
              issue.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                variant="outlined"
                startIcon={<Home />}
                onClick={() => (window.location.href = "/")}
              >
                Go Home
              </Button>
            </Box>

            {process.env.NODE_ENV === "development" && (
              <Box sx={{ mt: 3, textAlign: "left" }}>
                <Typography variant="h6" gutterBottom>
                  Debug Info (Development Only):
                </Typography>
                <pre
                  style={{
                    background: "#f5f5f5",
                    padding: "10px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    overflow: "auto",
                    maxHeight: "200px",
                  }}
                >
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
