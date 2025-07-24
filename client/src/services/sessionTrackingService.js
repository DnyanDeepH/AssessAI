import api from "./api";

/**
 * Service for tracking exam session activities
 */
class SessionTrackingService {
  /**
   * Track session activity
   * @param {string} examId - The exam ID
   * @param {string} eventType - The event type (focus, blur, idle, active, tab_switch, fullscreen_exit)
   * @param {Object} details - Additional details about the event
   * @returns {Promise} - The API response
   */
  trackActivity(examId, eventType, details = {}) {
    return api.post(`/student/exams/${examId}/track-activity`, {
      eventType,
      details,
    });
  }

  /**
   * Track tab visibility change
   * @param {string} examId - The exam ID
   * @param {boolean} isVisible - Whether the tab is visible
   * @returns {Promise} - The API response
   */
  trackVisibilityChange(examId, isVisible) {
    return this.trackActivity(examId, isVisible ? "focus" : "tab_switch", {
      timestamp: new Date().toISOString(),
      isVisible,
    });
  }

  /**
   * Track fullscreen exit
   * @param {string} examId - The exam ID
   * @returns {Promise} - The API response
   */
  trackFullscreenExit(examId) {
    return this.trackActivity(examId, "fullscreen_exit", {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track user idle state
   * @param {string} examId - The exam ID
   * @param {boolean} isIdle - Whether the user is idle
   * @returns {Promise} - The API response
   */
  trackIdleState(examId, isIdle) {
    return this.trackActivity(examId, isIdle ? "idle" : "active", {
      timestamp: new Date().toISOString(),
      isIdle,
    });
  }
}

export default new SessionTrackingService();
