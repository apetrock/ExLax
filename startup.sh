#!/bin/bash

# Check if project location is provided as an argument
if [ $# -eq 0 ]; then
    echo "Please provide the project location as an argument."
    exit 1
fi

# Navigate to the project location
original_dir=$(pwd)
cd $1

# Run npm start-all
npx pm2 start xlax-pm2-production.json
# Wait for 5 seconds, this is a hack since I can't find a better way
#sleep 3

# Open Chromium in full screen mode
chromium-browser --start-fullscreen http://localhost:8080/

cd $original_dir