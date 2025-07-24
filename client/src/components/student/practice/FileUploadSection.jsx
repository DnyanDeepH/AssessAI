import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import { CONSTANTS, formatFileSize, isAllowedFileType } from "../../../utils";

const FileUploadSection = ({
  onSubmit,
  isLoading,
  supportedTypes = CONSTANTS.ALLOWED_FILE_TYPES,
}) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    // Check file size
    if (file.size > CONSTANTS.MAX_FILE_SIZE) {
      return `File size exceeds the maximum limit of ${formatFileSize(
        CONSTANTS.MAX_FILE_SIZE
      )}`;
    }

    // Check file type
    if (!isAllowedFileType(file, supportedTypes)) {
      return `File type not supported. Allowed types: ${supportedTypes.join(
        ", "
      )}`;
    }

    return null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validationError = validateFile(droppedFile);

      if (validationError) {
        setError(validationError);
        return;
      }

      setFile(droppedFile);
      setError(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validationError = validateFile(selectedFile);

      if (validationError) {
        setError(validationError);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    const handleProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setUploadProgress(percentCompleted);
    };

    onSubmit(file, handleProgress);
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={supportedTypes.map((type) => `.${type}`).join(",")}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Drag and drop area */}
      <Paper
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        elevation={dragActive ? 3 : 1}
        sx={{
          border: dragActive ? "2px dashed #1976d2" : "2px dashed #ccc",
          borderRadius: 2,
          p: 3,
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: dragActive
            ? "rgba(25, 118, 210, 0.04)"
            : "transparent",
          transition: "all 0.2s ease",
          mb: 3,
        }}
        onClick={handleButtonClick}
      >
        <CloudUploadIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drag & Drop File Here
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          or click to browse
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supported file types: {supportedTypes.join(", ")}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          Maximum file size: {formatFileSize(CONSTANTS.MAX_FILE_SIZE)}
        </Typography>
      </Paper>

      {/* Error message */}
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Selected file */}
      {file && (
        <Box sx={{ mb: 3 }}>
          <List disablePadding>
            <ListItem
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={handleRemoveFile}
                  disabled={isLoading}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemIcon>
                <InsertDriveFileIcon />
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={formatFileSize(file.size)}
              />
            </ListItem>
          </List>

          {/* Upload progress */}
          {isLoading && uploadProgress > 0 && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
                {uploadProgress}% Uploaded
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Submit button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!file || isLoading}
        >
          Generate Practice Questions
        </Button>
      </Box>
    </Box>
  );
};

export default FileUploadSection;
