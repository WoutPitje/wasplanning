#!/bin/bash

# Run migrations on test database
echo "Setting up test database..."
DATABASE_NAME=wasplanning_test npm run migration:run
echo "Test database ready!"