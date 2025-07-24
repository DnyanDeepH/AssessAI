import React from "react";
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Paper,
  Divider,
  Chip,
} from "@mui/material";

const QuestionDisplay = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  showFeedback = false,
  questionNumber,
}) => {
  const isCorrect = showFeedback && selectedAnswer === question.correctAnswer;
  const isIncorrect =
    showFeedback && selectedAnswer && selectedAnswer !== question.correctAnswer;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 3,
        border: showFeedback
          ? `1px solid ${
              isCorrect
                ? "success.main"
                : isIncorrect
                ? "error.main"
                : "transparent"
            }`
          : "none",
        borderRadius: 2,
      }}
    >
      {/* Question header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" component="h2">
          Question {questionNumber}
        </Typography>

        {question.topic && (
          <Chip
            label={question.topic}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {/* Question text */}
      <Typography variant="body1" paragraph sx={{ fontWeight: 500 }}>
        {question.questionText}
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Options */}
      <FormControl component="fieldset" sx={{ width: "100%" }}>
        <RadioGroup
          value={selectedAnswer || ""}
          onChange={(e) => onAnswerSelect(e.target.value)}
        >
          {question.options.map((option, index) => {
            const optionLabel = ["A", "B", "C", "D"][index];
            const isOptionCorrect =
              showFeedback && option === question.correctAnswer;
            const isOptionSelected = selectedAnswer === option;

            return (
              <FormControlLabel
                key={index}
                value={option}
                disabled={showFeedback}
                control={
                  <Radio color={isOptionCorrect ? "success" : "primary"} />
                }
                label={
                  <Box
                    component="span"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: isOptionSelected ? 500 : 400,
                        color:
                          isOptionCorrect && showFeedback
                            ? "success.main"
                            : "inherit",
                      }}
                    >
                      {optionLabel}. {option}
                    </Typography>
                  </Box>
                }
                sx={{
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  bgcolor:
                    isOptionSelected && showFeedback
                      ? isOptionCorrect
                        ? "success.light"
                        : "error.light"
                      : isOptionCorrect && showFeedback
                      ? "success.light"
                      : "transparent",
                  "&:hover": {
                    bgcolor: showFeedback ? "inherit" : "action.hover",
                  },
                }}
              />
            );
          })}
        </RadioGroup>
      </FormControl>

      {/* Explanation (shown only when feedback is enabled) */}
      {showFeedback && question.explanation && (
        <Box
          sx={{ mt: 2, p: 2, bgcolor: "background.default", borderRadius: 1 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Explanation:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {question.explanation}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default QuestionDisplay;
