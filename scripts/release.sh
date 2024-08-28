#!/bin/bash

# Ensure a new version number is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <new_version>"
  exit 1
fi

NEW_VERSION="$1"

# Extract the current version from the root package.json
CURRENT_VERSION=$(grep '"version":' package.json | awk -F: '{print $2}' | tr -d ' ",')

# Replace the current version with the new version in the root package.json
sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" package.json

# Replace the current version with the new version in src/index.ts
sed -i "s/$CURRENT_VERSION/$NEW_VERSION/g" src/index.ts
