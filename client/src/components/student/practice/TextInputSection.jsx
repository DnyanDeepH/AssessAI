import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormHelperText,
} from "@mui/material";

const TextInputSection = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const minLength = 100; // Minimum text length required

  const handleTextChange = (e) => {
    setText(e.target.value);

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleSubmit = () => {
    // Validate text length
    if (!text.trim()) {
      setError("Please enter some text to generate questions.");
      return;
    }

    if (text.trim().length < minLength) {
      setError(
        `Text is too short. Please enter at least ${minLength} characters for better results.`
      );
      return;
    }

    onSubmit(text);
  };

  // Calculate character count and display color based on length
  const charCount = text.length;
  const getCharCountColor = () => {
    if (charCount === 0) return "text.secondary";
    if (charCount < minLength) return "error.main";
    return "success.main";
  };

  return (
    <Box>
      <Paper
        elevation={1}
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Enter your study material text below. For best results, include
          well-structured content with clear topics and definitions.
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          placeholder="Paste or type your study material here..."
          value={text}
          onChange={handleTextChange}
          disabled={isLoading}
          error={!!error}
          helperText={error}
          sx={{
            "& .MuiOutlinedInput-root": {
              fontFamily: "monospace",
            },
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 1,
          }}
        >
          <FormHelperText sx={{ color: getCharCountColor() }}>
            {charCount} characters{" "}
            {charCount < minLength && charCount > 0
              ? `(minimum ${minLength})`
              : ""}
          </FormHelperText>

          <Typography variant="caption" color="text.secondary">
            Recommended: 500+ characters for better results
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isLoading || charCount < minLength}
        >
          Generate Practice Questions
        </Button>
      </Box>
    </Box>
  );
};

export default TextInputSection;
