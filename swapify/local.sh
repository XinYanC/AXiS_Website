#!/bin/bash

# Connect to local Flask backend
export REACT_APP_API_URL="http://127.0.0.1:8000"
export REACT_APP_ENVIRONMENT="local"

echo "Starting app in LOCAL mode"
echo "API URL: $REACT_APP_API_URL"
echo ""

# Start the React app with Vite
npm run dev