#!/bin/bash

# Quick deployment check script
# This script helps verify your app is ready for Amplify deployment

echo "🚀 Checking deployment readiness..."

# Check if required files exist
echo "📁 Checking required files..."
if [ -f "amplify.yml" ]; then
    echo "✅ amplify.yml found"
else
    echo "❌ amplify.yml missing"
    exit 1
fi

if [ -f ".env.example" ]; then
    echo "✅ .env.example found"
else
    echo "❌ .env.example missing"
fi

if [ -f "prisma/schema.prisma" ]; then
    echo "✅ Prisma schema found"
else
    echo "❌ Prisma schema missing"
    exit 1
fi

# Check package.json scripts
echo "📦 Checking package.json scripts..."
if grep -q "\"build\":" package.json; then
    echo "✅ Build script found"
else
    echo "❌ Build script missing"
    exit 1
fi

if grep -q "\"postinstall\":" package.json; then
    echo "✅ Postinstall script found"
else
    echo "❌ Postinstall script missing (recommended for Prisma)"
fi

# Test build locally
echo "🔨 Testing local build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - fix errors before deploying"
    exit 1
fi

echo ""
echo "🎉 Your app appears ready for Amplify deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Set up AWS Amplify and connect your repository"
echo "3. Configure environment variables in Amplify console"
echo "4. Deploy your app"
echo ""
echo "See DEPLOYMENT.md for detailed instructions."
