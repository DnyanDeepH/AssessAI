import { useEffect, useRef } from "react";
import sessionTrackingService from "../services/sessionTrackingService";

/**
 * Hook for tracking exam session activities
 * @param {string} examId - The exam ID
 * @param {boolean} isActive - Whether the session is active
 * @param {number} idleTimeout - The idle timeout in milliseconds (default: 60000 - 1 minute)
 * @returns {Object} - Session tracking methods
 */
const useSessionTracking = (examId, isActive = true, idleTimeout = 60000) => {
  const idleTimerRef = useRef(null);
  const isIdleRef = useRef(false);

  // Track visibility changes
  useEffect(() => {
    if (!examId || !isActive) return;

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      sessionTrackingService
        .trackVisibilityChange(examId, isVisible)
        .catch((error) =>
          console.error("Error tracking visibility change:", error)
        );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [examId, isActive]);

  // Track fullscreen changes
  useEffect(() => {
    if (!examId || !isActive) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        sessionTrackingService
          .trackFullscreenExit(examId)
          .catch((error) =>
            console.error("Error tracking fullscreen exit:", error)
          );
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [examId, isActive]);

  // Track user activity and idle state
  useEffect(() => {
    if (!examId || !isActive) return;

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      if (isIdleRef.current) {
        isIdleRef.current = false;
        sessionTrackingService
          .trackIdleState(examId, false)
          .catch((error) =>
            console.error("Error tracking active state:", error)
          );
      }

      idleTimerRef.current = setTimeout(() => {
        isIdleRef.current = true;
        sessionTrackingService
          .trackIdleState(examId, true)
          .catch((error) => console.error("Error tracking idle state:", error));
      }, idleTimeout);
    };

    // Events to track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetIdleTimer);
    });

    // Initial setup
    resetIdleTimer();

    // Cleanup
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      events.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [examId, isActive, idleTimeout]);

  // Methods to manually track events
  const trackActivity = (eventType, details) => {
    if (!examId || !isActive) return Promise.resolve();
    return sessionTrackingService.trackActivity(examId, eventType, details);
  };

  const requestFullscreen = (element) => {
    if (!element) return;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  return {
    trackActivity,
    requestFullscreen,
    exitFullscreen,
    isIdle: isIdleRef.current,
  };
};

export default useSessionTracking;
