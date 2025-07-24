import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Alert,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import useSessionTracking from "../../hooks/useSessionTracking";

/**
 * Component that wraps the exam interface with security features
 * @param {Object} props - Component props
 * @param {string} props.examId - The exam ID
 * @param {boolean} props.isActive - Whether the exam is active
 * @param {React.ReactNode} props.children - The exam interface components
 * @param {Function} props.onSecurityViolation - Callback for security violations
 * @returns {React.ReactElement} - The wrapped exam interface
 */
const ExamSecurityWrapper = ({
  examId,
  isActive = true,
  children,
  onSecurityViolation,
}) => {
  const [securityWarnings, setSecurityWarnings] = useState([]);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const wrapperRef = useRef(null);
  const { trackActivity, requestFullscreen, exitFullscreen } =
    useSessionTracking(examId, isActive);

  // Track initial component mount
  useEffect(() => {
    if (isActive) {
      trackActivity("exam_interface_loaded", {
        timestamp: new Date().toISOString(),
      });
    }
  }, [isActive]);

  // Handle visibility change
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";

      if (!isVisible) {
        const warning = {
          id: Date.now(),
          message:
            "You navigated away from the exam tab. This activity has been recorded.",
          timestamp: new Date().toISOString(),
          type: "tab_switch",
        };

        setSecurityWarnings((prev) => [...prev, warning]);

        if (onSecurityViolation) {
          onSecurityViolation(warning);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive, onSecurityViolation]);

  // Handle fullscreen change
  useEffect(() => {
    if (!isActive) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive) {
        const warning = {
          id: Date.now(),
          message:
            "You exited fullscreen mode. This activity has been recorded.",
          timestamp: new Date().toISOString(),
          type: "fullscreen_exit",
        };

        setSecurityWarnings((prev) => [...prev, warning]);
        setShowFullscreenPrompt(true);

        if (onSecurityViolation) {
          onSecurityViolation(warning);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isActive, onSecurityViolation]);

  // Handle copy/paste prevention
  useEffect(() => {
    if (!isActive) return;

    const handleCopy = (e) => {
      e.preventDefault();

      const warning = {
        id: Date.now(),
        message:
          "Copy action detected and prevented. This activity has been recorded.",
        timestamp: new Date().toISOString(),
        type: "copy_attempt",
      };

      setSecurityWarnings((prev) => [...prev, warning]);
      trackActivity("copy_attempt", { timestamp: new Date().toISOString() });

      if (onSecurityViolation) {
        onSecurityViolation(warning);
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();

      const warning = {
        id: Date.now(),
        message:
          "Paste action detected and prevented. This activity has been recorded.",
        timestamp: new Date().toISOString(),
        type: "paste_attempt",
      };

      setSecurityWarnings((prev) => [...prev, warning]);
      trackActivity("paste_attempt", { timestamp: new Date().toISOString() });

      if (onSecurityViolation) {
        onSecurityViolation(warning);
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [isActive, onSecurityViolation, trackActivity]);

  // Handle right-click prevention
  useEffect(() => {
    if (!isActive) return;

    const handleContextMenu = (e) => {
      e.preventDefault();

      const warning = {
        id: Date.now(),
        message:
          "Right-click detected and prevented. This activity has been recorded.",
        timestamp: new Date().toISOString(),
        type: "right_click",
      };

      setSecurityWarnings((prev) => [...prev, warning]);
      trackActivity("right_click", { timestamp: new Date().toISOString() });

      if (onSecurityViolation) {
        onSecurityViolation(warning);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isActive, onSecurityViolation, trackActivity]);

  // Enter fullscreen on initial load
  useEffect(() => {
    if (isActive) {
      setShowFullscreenPrompt(true);
    }
  }, [isActive]);

  // Handle entering fullscreen
  const handleEnterFullscreen = () => {
    if (wrapperRef.current) {
      requestFullscreen(wrapperRef.current);
      setShowFullscreenPrompt(false);
    }
  };

  // Handle dismissing a warning
  const handleDismissWarning = (id) => {
    setSecurityWarnings((prev) => prev.filter((warning) => warning.id !== id));
  };

  return (
    <Box
      ref={wrapperRef}
      sx={{ width: "100%", height: "100%", position: "relative" }}
    >
      {/* Security warnings */}
      <Box
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 1000,
          maxWidth: 400,
        }}
      >
        {securityWarnings.map((warning) => (
          <Alert
            key={warning.id}
            severity="warning"
            sx={{ mb: 2 }}
            onClose={() => handleDismissWarning(warning.id)}
          >
            {warning.message}
          </Alert>
        ))}
      </Box>

      {/* Fullscreen prompt */}
      <Dialog
        open={showFullscreenPrompt}
        onClose={() => {}}
        disableEscapeKeyDown
      >
        <DialogTitle>Enter Fullscreen Mode</DialogTitle>
        <DialogContent>
          <Typography>
            For exam security, you must enter fullscreen mode to continue.
            Exiting fullscreen during the exam will be recorded and may be
            flagged for review.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleEnterFullscreen}
            variant="contained"
            color="primary"
          >
            Enter Fullscreen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exam content */}
      {children}
    </Box>
  );
};

export default ExamSecurityWrapper;
