import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AuthRedirect = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect authenticated users to their dashboard
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "student") {
        navigate("/student", { replace: true });
      }
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  // Don't render children if user is authenticated (they should be redirected)
  if (isAuthenticated && user) {
    return null;
  }

  return children;
};

export default AuthRedirect;
