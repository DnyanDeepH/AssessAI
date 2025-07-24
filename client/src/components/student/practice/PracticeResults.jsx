import React, { useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ReplayIcon from "@mui/icons-material/Replay";
import HomeIcon from "@mui/icons-material/Home";
import QuestionDisplay from "./QuestionDisplay";
import { calculatePercentage } from "../../../utils";

const PracticeResults = ({ questions, answers, onRestart, onExit }) => {
  // Calculate score and statistics
  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    questions.forEach((question, index) => {
      const userAnswer = answers[index];

      if (!userAnswer) {
        unanswered++;
      } else if (userAnswer === question.correctAnswer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const totalAnswered = correct + incorrect;
    const score = totalAnswered > 0 ? (correct / totalAnswered) * 100 : 0;

    return {
      correct,
      incorrect,
      unanswered,
      totalQuestions: questions.length,
      score,
      percentage: calculatePercentage(correct, questions.length),
    };
  }, [questions, answers]);

  // Get feedback message based on score
  const getFeedbackMessage = () => {
    const percentage = stats.percentage;

    if (percentage >= 90) {
      return "Excellent! You've mastered this material.";
    } else if (percentage >= 70) {
      return "Good job! You have a solid understanding of the material.";
    } else if (percentage >= 50) {
      return "Not bad! With a bit more practice, you'll improve your score.";
    } else {
      return "Keep practicing! Review the material and try again.";
    }
  };

  return (
    <Box>
      {/* Results summary */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Practice Results
        </Typography>

        <Grid container spacing={4} sx={{ mt: 1 }}>
          {/* Score circle */}
          <Grid item xs={12} sm={4} sx={{ textAlign: "center" }}>
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress
                variant="determinate"
                value={stats.percentage}
                size={120}
                thickness={5}
                color={
                  stats.percentage >= 70
                    ? "success"
                    : stats.percentage >= 50
                    ? "warning"
                    : "error"
                }
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="h4" component="div" color="text.primary">
                  {Math.round(stats.percentage)}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1" sx={{ mt: 2 }}>
              {getFeedbackMessage()}
            </Typography>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12} sm={8}>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={`Correct Answers: ${stats.correct} of ${stats.totalQuestions}`}
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <CancelIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={`Incorrect Answers: ${stats.incorrect} of ${stats.totalQuestions}`}
                />
              </ListItem>

              {stats.unanswered > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <CancelIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Unanswered Questions: ${stats.unanswered} of ${stats.totalQuestions}`}
                  />
                </ListItem>
              )}
            </List>
          </Grid>
        </Grid>

        {/* Action buttons */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ReplayIcon />}
            onClick={onRestart}
          >
            Practice Again
          </Button>

          <Button variant="contained" startIcon={<HomeIcon />} onClick={onExit}>
            Exit to Practice Zone
          </Button>
        </Box>
      </Paper>

      {/* Detailed question review */}
      <Typography variant="h6" gutterBottom>
        Question Review
      </Typography>

      {questions.map((question, index) => (
        <QuestionDisplay
          key={index}
          question={question}
          selectedAnswer={answers[index]}
          onAnswerSelect={() => {}}
          showFeedback={true}
          questionNumber={index + 1}
        />
      ))}
    </Box>
  );
};

export default PracticeResults;
