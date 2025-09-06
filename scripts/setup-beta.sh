#!/bin/bash

echo "🚀 Setting up RSS Aggregator Beta..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/rss_aggregator"

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Admin
ADMIN_TOKEN=your-secret-admin-token-$(date +%s)

# Scraper
SCRAPER_USER_AGENT=AggregatorBot/1.0
FETCH_CONCURRENCY=2
FETCH_DELAY_MS=500

# Cron
CRON_ENABLED=true
CRON_EXPR=0 */4 * * *

# Production
NODE_ENV=development
PORT=3000
EOF
    echo "✅ .env file created with random ADMIN_TOKEN"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️ Running database migrations..."
npx prisma migrate dev --name beta_features

# Seed database
echo "🌱 Seeding database..."
npm run prisma:seed

# Create PWA icons (placeholder)
echo "🎨 Creating PWA icons..."
if [ ! -f public/icon-192.png ]; then
    # Create a simple placeholder icon
    convert -size 192x192 xc:blue -fill white -pointsize 48 -gravity center -annotate +0+0 "RSS" public/icon-192.png 2>/dev/null || echo "⚠️ ImageMagick not found, skipping icon creation"
fi

if [ ! -f public/icon-512.png ]; then
    # Create a simple placeholder icon
    convert -size 512x512 xc:blue -fill white -pointsize 128 -gravity center -annotate +0+0 "RSS" public/icon-512.png 2>/dev/null || echo "⚠️ ImageMagick not found, skipping icon creation"
fi

echo ""
echo "🎉 Beta setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update ADMIN_TOKEN in .env file"
echo "2. Run: npm run dev"
echo "3. Visit: http://localhost:3000"
echo "4. Admin Dashboard: http://localhost:3000/admin/dashboard"
echo "5. Database Admin: http://localhost:8080"
echo ""
echo "🔧 Services:"
echo "- App: http://localhost:3000"
echo "- PostgreSQL: localhost:5432"
echo "- Redis: localhost:6379"
echo "- Adminer: http://localhost:8080"
echo ""
echo "📚 Documentation: BETA_SETUP.md"
