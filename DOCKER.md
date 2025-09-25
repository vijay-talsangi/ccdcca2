# Docker Setup for CCDCCA2 Application

This document provides comprehensive instructions for running the CCDCCA2 Node.js application using Docker with Neon Database support for both development and production environments.

## Overview

The application supports two distinct Docker environments:

- **Development**: Uses Neon Local proxy for ephemeral database branches
- **Production**: Connects directly to Neon Cloud database

## Prerequisites

### Required Software

- Docker Desktop (20.10+)
- Docker Compose (2.0+)
- Git (for branch-based development)

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Neon Database Configuration
NEON_API_KEY=your_neon_api_key_here
NEON_PROJECT_ID=your_neon_project_id_here
PARENT_BRANCH_ID=your_main_branch_id_here

# Security Configuration
JWT_SECRET=your_jwt_secret_here
ARCJET_KEY=your_arcjet_key_here

# Production Database URL (for production deployments)
DATABASE_URL=postgresql://user:pass@ep-example-123456-pooler.region.aws.neon.tech/dbname?sslmode=require
```

## Development Environment

### Quick Start

1. **Clone and setup the repository:**

   ```bash
   git clone <repository-url>
   cd ccdcca2
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.development .env
   # Edit .env with your actual Neon credentials
   ```

3. **Start the development environment:**

   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

4. **Access the application:**
   - Application: http://localhost:3000
   - Health check: http://localhost:3000/health
   - Database: localhost:5432 (via Neon Local proxy)

### Development Features

#### Neon Local Integration

- **Ephemeral Branches**: Each container startup creates a fresh database branch
- **Automatic Cleanup**: Branches are deleted when containers stop
- **Git Integration**: Persistent branches per Git branch (optional)
- **Local Development**: No need to modify connection strings

#### Hot Reloading

- Source code is mounted as volumes for instant updates
- Changes to `/src` directory trigger automatic restarts via `--watch`

#### Database Operations

```bash
# Generate new migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

### Development Commands

```bash
# Build and start development environment
docker-compose -f docker-compose.dev.yml up --build

# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop the development environment
docker-compose -f docker-compose.dev.yml down

# Remove volumes (fresh start)
docker-compose -f docker-compose.dev.yml down -v

# Execute commands in running container
docker-compose -f docker-compose.dev.yml exec app npm run lint
```

### Persistent Branches per Git Branch

Enable persistent database branches that correspond to your Git branches:

1. **Uncomment volume mounts** in `docker-compose.dev.yml`:

   ```yaml
   volumes:
     - ./.neon_local/:/tmp/.neon_local
     - ./.git/HEAD:/tmp/.git/HEAD:ro
   ```

2. **Set environment variable**:

   ```bash
   DELETE_BRANCH=false
   ```

3. **Add to .gitignore** (already included):
   ```bash
   .neon_local/
   ```

## Production Environment

### Configuration

1. **Set production environment variables:**

   ```bash
   export DATABASE_URL="postgresql://user:pass@ep-example-123456-pooler.region.aws.neon.tech/dbname?sslmode=require"
   export JWT_SECRET="your-strong-production-jwt-secret"
   export ARCJET_KEY="your-production-arcjet-key"
   export LOG_LEVEL="info"
   export PORT="3000"
   ```

2. **Deploy the application:**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

### Production Features

#### Security Enhancements

- **Read-only filesystem**: Container runs with read-only root filesystem
- **Resource limits**: Memory and CPU limits configured
- **Non-root user**: Application runs as non-privileged user
- **Health checks**: Comprehensive health monitoring
- **Security options**: No new privileges, secure tmpfs mounts

#### Database Connection

- Direct connection to Neon Cloud database
- Optimized for serverless operations
- Connection pooling enabled
- Automatic SSL/TLS encryption

### Production Commands

```bash
# Deploy production environment
docker-compose -f docker-compose.prod.yml up --build -d

# Scale application (if using swarm/orchestrator)
docker-compose -f docker-compose.prod.yml up --scale app=3

# View production logs
docker-compose -f docker-compose.prod.yml logs -f app

# Update production deployment
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Stop production environment
docker-compose -f docker-compose.prod.yml down
```

## Environment Variable Management

### Development (.env.development)

```bash
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgres://neon:npg@neon-local:5432/main?sslmode=require
```

### Production (.env.production)

```bash
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=${DATABASE_URL}  # Injected by orchestrator
JWT_SECRET=${JWT_SECRET}      # Injected by orchestrator
ARCJET_KEY=${ARCJET_KEY}      # Injected by orchestrator
```

## Troubleshooting

### Common Issues

#### Neon Local Connection Issues

```bash
# Check Neon Local container logs
docker-compose -f docker-compose.dev.yml logs neon-local

# Verify environment variables
docker-compose -f docker-compose.dev.yml exec neon-local env | grep NEON

# Test database connection
docker-compose -f docker-compose.dev.yml exec app node -e "
const { sql } = require('./src/config/database.js');
sql\`SELECT 1 as test\`.then(console.log).catch(console.error);
"
```

#### Permission Issues

```bash
# Fix log directory permissions
sudo chown -R $(id -u):$(id -g) logs/

# Reset Docker permissions
docker-compose -f docker-compose.dev.yml down
docker system prune -f
```

#### Database Migration Issues

```bash
# Reset development database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d neon-local
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### Performance Monitoring

#### Development Monitoring

```bash
# Container resource usage
docker stats

# Application logs with filtering
docker-compose -f docker-compose.dev.yml logs app | grep ERROR

# Database query logs (development only)
docker-compose -f docker-compose.dev.yml logs app | grep "SELECT\|INSERT\|UPDATE\|DELETE"
```

#### Production Monitoring

```bash
# Health check status
curl http://localhost:3000/health

# Container health
docker inspect ccdcca2-app-prod | grep -A 5 "Health"

# Application metrics endpoint (if implemented)
curl http://localhost:3000/metrics
```

## Advanced Configuration

### Custom SSL Certificates (Production)

```yaml
volumes:
  - ./certs:/app/certs:ro
```

### Reverse Proxy Setup (Production)

Uncomment the nginx service in `docker-compose.prod.yml` and create `nginx.conf`:

```nginx
upstream app {
    server app:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Database Connection Pooling

The application automatically configures connection pooling based on the environment:

- **Development**: Single connection with query logging
- **Production**: Optimized pool with connection caching

## Deployment Examples

### Docker Swarm

```bash
docker stack deploy -c docker-compose.prod.yml ccdcca2
```

### Kubernetes

Convert using Kompose:

```bash
kompose convert -f docker-compose.prod.yml
kubectl apply -f .
```

### Cloud Providers

- **AWS ECS**: Use task definitions with environment variable injection
- **Google Cloud Run**: Deploy with cloud-native service discovery
- **Azure Container Instances**: Use managed container groups

## Support

For issues related to:

- **Docker**: Check container logs and resource limits
- **Neon Local**: Verify API keys and project configuration
- **Database**: Check connection strings and migration status
- **Application**: Review application logs and health endpoints
