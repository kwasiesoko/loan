#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Starting Loan backend..."
exec node dist/main.js
