#!/bin/bash
# Build script for Vercel deployment

echo "Starting build process..."

# Navigate to client directory
cd client

echo "Installing client dependencies..."
npm install

echo "Building client application..."
npm run build

echo "Build completed successfully!"
