import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  Divider,
  LinearProgress,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import QuestionDisplay from "./QuestionDisplay";
import PracticeResults from "./PracticeResults";
import { generateTempId } from "../../../utils";

const PracticeSession = ({ questions, onExit, onRestart }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [sessionId, setSessionId] = useState(generateTempId());

  // Initialize session in localStorage to track progress
  useEffect(() => {
    const savedSession = localStorage.getItem(`practice_session_${sessionId}`);

    if (savedSession) {
      const parsedSession = JSON.parse(savedSession);
      setAnswers(parsedSession.answers || {});
      setActiveStep(parsedSession.activeStep || 0);
    }

    // Save session when component unmounts
    return () => {
      saveSession();
    };
  }, [sessionId]);

  // Save session to localStorage whenever answers or activeStep changes
  useEffect(() => {
    saveSession();
  }, [answers, activeStep]);

  const saveSession = () => {
    localStorage.setItem(
      `practice_session_${sessionId}`,
      JSON.stringify({
        answers,
        activeStep,
        timestamp: new Date().toISOString(),
      })
    );
  };

  const handleAnswerSelect = (answer) => {
    setAnswers({
      ...answers,
      [activeStep]: answer,
    });
  };

  const handleNext = () => {
    const nextStep = activeStep + 1;
    if (nextStep < questions.length) {
      setActiveStep(nextStep);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(0, prevStep - 1));
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  const handleFinish = () => {
    setShowResults(true);
  };

  const handleRestart = () => {
    setAnswers({});
    setActiveStep(0);
    setShowResults(false);
    setSessionId(generateTempId());

    if (onRestart) {
      onRestart();
    }
  };

  // Calculate progress percentage
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  // If showing results, render the results component
  if (showResults) {
    return (
      <PracticeResults
        questions={questions}
        answers={answers}
        onRestart={handleRestart}
        onExit={onExit}
      />
    );
  }

  const currentQuestion = questions[activeStep];

  return (
    <Box>
      {/* Session header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          AI Practice Session
        </Typography>

        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {answeredCount} of {questions.length} answered
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progressPercentage)}% complete
            </Typography>
          </Box>
        </Box>

        {/* Question navigation */}
        <Stepper
          nonLinear
          activeStep={activeStep}
          alternativeLabel
          sx={{
            overflowX: "auto",
            "& .MuiStepConnector-root": { top: 10 },
          }}
        >
          {questions.map((question, index) => {
            const hasAnswer = !!answers[index];

            return (
              <Step key={index} completed={hasAnswer}>
                <StepButton
                  onClick={() => handleStepClick(index)}
                  icon={
                    hasAnswer ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : null
                  }
                >
                  {index + 1}
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Current question */}
      {currentQuestion && (
        <QuestionDisplay
          question={currentQuestion}
          selectedAnswer={answers[activeStep]}
          onAnswerSelect={handleAnswerSelect}
          questionNumber={activeStep + 1}
        />
      )}

      {/* Navigation buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Previous
        </Button>

        <Box>
          {activeStep === questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinish}
              endIcon={<CheckCircleIcon />}
              disabled={answeredCount < questions.length}
            >
              Finish
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>

      {/* Show alert if not all questions are answered */}
      {activeStep === questions.length - 1 &&
        answeredCount < questions.length && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Please answer all questions before finishing the practice session.
          </Alert>
        )}
    </Box>
  );
};

export default PracticeSession;
