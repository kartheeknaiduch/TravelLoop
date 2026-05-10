#!/usr/bin/env bash

set -e

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Building frontend..."
pnpm --filter traveloop-frontend build

echo "Building backend..."
pnpm --filter traveloop-backend build

echo "Running database migrations..."
pnpm --filter traveloop-backend db:push:force

echo "Seeding database..."
pnpm --filter traveloop-backend db:seed

echo "Starting server..."
cd backend && pnpm start