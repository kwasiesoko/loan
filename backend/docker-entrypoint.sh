#!/bin/sh
set -e

# Ensure upload directories exist (Volumes might mask these)
mkdir -p uploads/kyc

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Starting Loan backend..."
exec node dist/main.js
