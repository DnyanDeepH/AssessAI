import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Grid,
} from "@mui/material";

const PracticeOptions = ({ options, onOptionsChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onOptionsChange({ [name]: value });
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        Practice Options
      </Typography>

      <Grid container spacing={3}>
        {/* Number of questions */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="question-count-label">
              Number of Questions
            </InputLabel>
            <Select
              labelId="question-count-label"
              id="question-count"
              name="questionCount"
              value={options.questionCount}
              label="Number of Questions"
              onChange={handleChange}
            >
              <MenuItem value={3}>3 Questions</MenuItem>
              <MenuItem value={5}>5 Questions</MenuItem>
              <MenuItem value={10}>10 Questions</MenuItem>
              <MenuItem value={15}>15 Questions</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Difficulty level */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="difficulty-label">Difficulty Level</InputLabel>
            <Select
              labelId="difficulty-label"
              id="difficulty"
              name="difficulty"
              value={options.difficulty}
              label="Difficulty Level"
              onChange={handleChange}
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Topic (optional) */}
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            size="small"
            id="topic"
            name="topic"
            label="Topic (Optional)"
            placeholder="e.g., Biology, History"
            value={options.topic}
            onChange={handleChange}
            helperText="Leave blank to generate questions on all topics"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PracticeOptions;
