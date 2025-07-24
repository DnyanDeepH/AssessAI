import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../../services/api";

/**
 * Component for displaying session analytics for an exam
 * @param {Object} props - Component props
 * @param {string} props.examId - The exam ID
 * @returns {React.ReactElement} - The session analytics component
 */
const SessionAnalytics = ({ examId }) => {
  const [analytics, setAnalytics] = useState({
    submissionsByHour: {},
    flaggedSubmissionDetails: [],
    overview: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [sessionEvents, setSessionEvents] = useState({
    events: [],
  });
  const [showEventsDialog, setShowEventsDialog] = useState(false);

  // Fetch session analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/admin/exams/${examId}/session-analytics`
        );
        setAnalytics(response.data.data);
        setError(null);
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Failed to fetch session analytics"
        );
        console.error("Error fetching session analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchAnalytics();
    }
  }, [examId]);

  // Fetch session events for a submission
  const fetchSessionEvents = async (submissionId) => {
    try {
      setLoading(true);
      const response = await api.get(
        `/admin/submissions/${submissionId}/session-events`
      );
      setSessionEvents(response.data.data);
      setShowEventsDialog(true);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.error?.message || "Failed to fetch session events"
      );
      console.error("Error fetching session events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing session events
  const handleViewEvents = (submission) => {
    setSelectedSubmission(submission);
    fetchSessionEvents(submission.submissionId);
  };

  // Close events dialog
  const handleCloseEventsDialog = () => {
    setShowEventsDialog(false);
    setSessionEvents(null);
    setSelectedSubmission(null);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  // Prepare chart data for submissions by hour
  const prepareHourlyData = () => {
    if (!analytics || !analytics.submissionsByHour) return [];

    return Object.entries(analytics?.submissionsByHour || {})
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        count,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  };

  // Prepare pie chart data for flagged submissions
  const prepareFlaggedData = () => {
    if (!analytics) return [];

    return [
      { name: "Flagged", value: analytics.flaggedSubmissions },
      {
        name: "Normal",
        value: analytics.totalSubmissions - analytics.flaggedSubmissions,
      },
    ];
  };

  // Colors for pie chart
  const COLORS = ["#FF8042", "#00C49F"];

  if (loading && !analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading session analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No session analytics available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Session Analytics
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Submissions
              </Typography>
              <Typography variant="h4">{analytics.totalSubmissions}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Avg. Time Spent
              </Typography>
              <Typography variant="h4">
                {analytics.averageTimeSpent} min
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Flagged Submissions
              </Typography>
              <Typography variant="h4">
                {analytics.flaggedSubmissions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Changes
              </Typography>
              <Typography variant="h4">{analytics.deviceChanges}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Submissions by Hour
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prepareHourlyData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Submissions" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Flagged vs Normal
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prepareFlaggedData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {(prepareFlaggedData() || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Flagged Submissions Table */}
      {analytics?.flaggedSubmissionDetails &&
        (analytics.flaggedSubmissionDetails || []).length > 0 && (
          <Paper sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Flagged Submissions
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Submitted At</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(analytics?.flaggedSubmissionDetails || []).map(
                    (submission) => (
                      <TableRow key={submission.submissionId}>
                        <TableCell>{submission.studentName}</TableCell>
                        <TableCell>{submission.studentEmail}</TableCell>
                        <TableCell>
                          {formatTimestamp(submission.submittedAt)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              submission.reason?.substring(0, 30) + "..." ||
                              "Flagged for review"
                            }
                            color="warning"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewEvents(submission)}
                          >
                            View Events
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

      {/* Session Events Dialog */}
      <Dialog
        open={showEventsDialog}
        onClose={handleCloseEventsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Session Events
          {selectedSubmission && (
            <Typography variant="subtitle2">
              Student: {selectedSubmission.studentName} (
              {selectedSubmission.studentEmail})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {sessionEvents ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">Submission ID:</Typography>
                  <Typography variant="body2">
                    {sessionEvents.submissionId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">Started At:</Typography>
                  <Typography variant="body2">
                    {formatTimestamp(sessionEvents.startedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">Submitted At:</Typography>
                  <Typography variant="body2">
                    {formatTimestamp(sessionEvents.submittedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">Time Spent:</Typography>
                  <Typography variant="body2">
                    {sessionEvents.timeSpent} minutes
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">Score:</Typography>
                  <Typography variant="body2">
                    {sessionEvents.percentage}%
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2">IP Address:</Typography>
                  <Typography variant="body2">
                    {sessionEvents.ipAddress}
                  </Typography>
                </Grid>
              </Grid>

              {sessionEvents.reviewNotes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Review Notes:</Typography>
                  <Paper sx={{ p: 2, bgcolor: "#fff9c4" }}>
                    <Typography variant="body2" whiteSpace="pre-line">
                      {sessionEvents.reviewNotes}
                    </Typography>
                  </Paper>
                </Box>
              )}

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Event Timeline
              </Typography>

              <List>
                {sessionEvents?.events &&
                (sessionEvents.events || []).length > 0 ? (
                  (sessionEvents.events || []).map((event, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={`${event.eventType.toUpperCase()} at ${formatTimestamp(
                            event.timestamp
                          )}`}
                          secondary={
                            <Box component="span">
                              {event.details &&
                                Object.entries(event.details || {}).map(
                                  ([key, value]) => (
                                    <Typography
                                      key={key}
                                      variant="body2"
                                      component="span"
                                      display="block"
                                    >
                                      {key}:{" "}
                                      {typeof value === "object"
                                        ? JSON.stringify(value)
                                        : value.toString()}
                                    </Typography>
                                  )
                                )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < (sessionEvents?.events || []).length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No events recorded" />
                  </ListItem>
                )}
              </List>
            </>
          ) : (
            <Typography>Loading session events...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEventsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionAnalytics;
