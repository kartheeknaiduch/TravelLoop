#!/usr/bin/env bash
set -e

echo "Running database migrations..."
pnpm --filter traveloop-backend db:push:force

echo "Seeding database..."
pnpm --filter traveloop-backend db:seed

echo "Starting server..."
cd backend && pnpm start
