#!/bin/bash

# Check if project location is provided as an argument
if [ $# -eq 0 ]; then
    working_dir=$(dirname -- "$(readlink -f -- "$0")")
    echo "Setting working dir to: $working_dir"
else
    working_dir="$1"
fi

# Navigate to the project location
cd "$working_dir" || exit

# Navigate to the project location
original_dir=$(pwd)
cd $working_dir

# Run npm start-all
npx pm2 start xlax-pm2-production.json
# Wait for 5 seconds, this is a hack since I can't find a better way
sleep 5

# Open Chromium in full screen mode
chromium-browser --start-fullscreen --kiosk http://localhost:8080/

cd $original_dir
