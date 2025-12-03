#!/bin/bash

echo "🐳 Backend Proxy - Docker Setup"
echo "================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down -v 2>/dev/null
echo ""

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache
echo ""

echo "🚀 Starting all services..."
docker-compose up -d
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""

# Test the system
echo "🧪 Testing the system..."
echo ""

echo "Test 1: HTTP Region 1"
curl -s -H "x-region: 1" http://localhost:3000/ || echo "Failed"
echo ""

echo "Test 2: HTTP Region 2"
curl -s -H "x-region: 2" http://localhost:3000/ || echo "Failed"
echo ""

echo "Test 3: Proxy Health Check"
curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health
echo ""

echo ""
echo "✨ Docker setup complete!"
echo ""
echo "📋 Useful commands:"
echo "  View logs:          docker-compose logs -f"
echo "  View specific:      docker-compose logs -f proxy"
echo "  Stop all:           docker-compose stop"
echo "  Restart all:        docker-compose restart"
echo "  Shut down:          docker-compose down"
echo "  Shut down + clean:  docker-compose down -v"
echo ""
echo "🌐 Services available at:"
echo "  Proxy:              http://localhost:3000"
echo "  HTTP Server A:      http://localhost:4001"
echo "  HTTP Server B:      http://localhost:4002"
echo "  WebSocket Server 1: ws://localhost:5001"
echo "  WebSocket Server 2: ws://localhost:5002"
echo "  Redis:              localhost:6379"
echo ""
echo "📱 Open client/index.html in your browser to test WebSocket chat!"
