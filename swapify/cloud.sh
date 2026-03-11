#!/bin/bash

# Connect to cloud backend (PythonAnywhere)
export REACT_APP_API_URL="https://xinyanc.pythonanywhere.com"
export REACT_APP_ENVIRONMENT="production"

echo "Starting app in CLOUD mode"
echo "API URL: $REACT_APP_API_URL"
echo ""

# Start the React app with Vite
npm run dev