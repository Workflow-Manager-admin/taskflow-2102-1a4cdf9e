#!/bin/bash
cd /home/kavia/workspace/code-generation/taskflow-2102-1a4cdf9e/task_tracker_frontend_workspace/task_tracker_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

