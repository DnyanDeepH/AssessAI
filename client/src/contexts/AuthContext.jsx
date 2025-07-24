import React, { createContext, useContext, useReducer, useEffect } from "react";
import { storage, CONSTANTS } from "../utils/index.ts";
import { authService } from "../services/authService";

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  REGISTER_START: "REGISTER_START",
  REGISTER_SUCCESS: "REGISTER_SUCCESS",
  REGISTER_FAILURE: "REGISTER_FAILURE",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_LOADING: "SET_LOADING",
  RESTORE_SESSION: "RESTORE_SESSION",
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_ACTIONS.RESTORE_SESSION:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on app load
  useEffect(() => {
    const restoreSession = () => {
      try {
        const token = storage.get(CONSTANTS.TOKEN_KEY);
        const user = storage.get(CONSTANTS.USER_KEY);

        if (token && user) {
          dispatch({
            type: AUTH_ACTIONS.RESTORE_SESSION,
            payload: { token, user },
          });
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error("Error restoring session:", error);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    restoreSession();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authService.login(credentials);

      if (response.success) {
        // Handle nested response structure
        const actualData = response.data?.data || response.data;
        const userData = actualData.user;
        const token = actualData.token;

        // Store in localStorage
        storage.set(CONSTANTS.TOKEN_KEY, token);
        storage.set(CONSTANTS.USER_KEY, userData);

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            token: token,
            user: userData,
          },
        });

        return { success: true, user: userData, role: userData?.role };
      } else {
        throw new Error(response.error.message || "Login failed");
      }
    } catch (error) {
      const errorMessage = error.message || "An error occurred during login";
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const response = await authService.register(userData);

      if (response.success) {
        // Store in localStorage
        storage.set(CONSTANTS.TOKEN_KEY, response.data.token);
        storage.set(CONSTANTS.USER_KEY, response.data.user);

        // Handle nested response structure for registration too
        const actualData = response.data?.data || response.data;
        const userData = actualData.user;
        const token = actualData.token;

        // Store in localStorage
        storage.set(CONSTANTS.TOKEN_KEY, token);
        storage.set(CONSTANTS.USER_KEY, userData);

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: {
            token: token,
            user: userData,
          },
        });

        return { success: true, user: userData };
      } else {
        throw new Error(response.error.message || "Registration failed");
      }
    } catch (error) {
      const errorMessage =
        error.message || "An error occurred during registration";
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    storage.remove(CONSTANTS.TOKEN_KEY);
    storage.remove(CONSTANTS.USER_KEY);
    storage.remove(CONSTANTS.EXAM_SESSION_KEY);

    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user && state.user.role === role;
  };

  // Check if user is admin
  const isAdmin = () => hasRole("admin");

  // Check if user is student
  const isStudent = () => hasRole("student");

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    hasRole,
    isAdmin,
    isStudent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
