.PHONY: help build up down logs restart clean test

help: ## Show this help message
	@echo "Backend Proxy - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d
	@echo "Services starting... waiting for health checks..."
	@sleep 5
	@docker-compose ps

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

logs-proxy: ## View proxy logs
	docker-compose logs -f proxy

logs-redis: ## View Redis logs
	docker-compose logs -f redis

restart: ## Restart all services
	docker-compose restart

clean: ## Stop and remove all containers, volumes, and images
	docker-compose down -v
	docker system prune -f

test: ## Test the system
	@echo "Testing HTTP Region 1..."
	@curl -s -H "x-region: 1" http://localhost:3000/ || echo "Failed"
	@echo ""
	@echo "Testing HTTP Region 2..."
	@curl -s -H "x-region: 2" http://localhost:3000/ || echo "Failed"
	@echo ""
	@echo "Testing Health Check..."
	@curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health

ps: ## Show service status
	docker-compose ps

rebuild: down build up ## Rebuild and restart all services

start: up ## Alias for up
stop: down ## Alias for down
