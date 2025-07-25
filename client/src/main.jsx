import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  // Temporarily disable StrictMode to prevent double API calls in development
  // Re-enable for production builds
  process.env.NODE_ENV === "production" ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  )
);
