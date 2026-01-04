# Docker Data Persistence Guide

## Problem
When rebuilding Docker containers, all data (users, posts, stories) was being lost because the app was using in-memory storage.

## Solution
The Docker setup now uses **PostgreSQL with persistent volumes** to ensure data survives container rebuilds.

## What's Fixed

### 1. Database Persistence
- PostgreSQL data is stored in a Docker volume (`postgres_data`)
- Data persists across container rebuilds, restarts, and updates
- Volume is stored outside the container, so data survives even when containers are removed

### 2. File Upload Persistence
- Uploaded files (images, videos, stories) are stored in a Docker volume (`uploads_data`)
- Files persist across container rebuilds

### 3. Automatic Database Usage
- The app automatically uses PostgreSQL when `DATABASE_URL` is set
- Falls back to in-memory storage only if database is unavailable
- No code changes needed - it's automatic!

## How It Works

### Docker Volumes
```yaml
volumes:
  postgres_data:    # Database data persists here
  uploads_data:     # Uploaded files persist here
```

These volumes are managed by Docker and stored on your host machine, separate from the containers.

### Storage Initialization
The app automatically detects `DATABASE_URL` and:
1. ✅ If `DATABASE_URL` is set → Uses PostgreSQL (DatabaseStorage)
2. ⚠️ If not set → Uses in-memory storage (MemStorage)

## Usage

### First Time Setup
```bash
docker-compose up -d
```

### Rebuild Container (Data Persists!)
```bash
docker-compose build
docker-compose up -d
```

### View Persistent Data
```bash
# List volumes
docker volume ls

# Inspect postgres_data volume
docker volume inspect cricstagram-1_postgres_data

# Inspect uploads_data volume
docker volume inspect cricstagram-1_uploads_data
```

### Backup Database
```bash
# Backup PostgreSQL data
docker-compose exec db pg_dump -U postgres cricsocial > backup.sql

# Restore from backup
docker-compose exec -T db psql -U postgres cricsocial < backup.sql
```

### Reset Everything (Delete All Data)
```bash
# Stop containers
docker-compose down

# Remove volumes (⚠️ This deletes all data!)
docker volume rm cricstagram-1_postgres_data cricstagram-1_uploads_data

# Start fresh
docker-compose up -d
```

## Important Notes

1. **Data Location**: Volumes are stored in Docker's volume directory (usually `/var/lib/docker/volumes/` on Linux)

2. **Backup Regularly**: While data persists across rebuilds, always backup important data before major changes

3. **Environment Variables**: Make sure `DATABASE_URL` is set in `docker-compose.yml` (it's already configured)

4. **First Run**: On first run, the database will be empty. The app will seed sample data automatically.

## Troubleshooting

### Data Still Lost After Rebuild?
- Check if volumes exist: `docker volume ls`
- Verify `DATABASE_URL` is set: `docker-compose config`
- Check logs: `docker-compose logs app | grep Database`

### Database Connection Issues?
- Wait for database to be healthy: `docker-compose ps`
- Check database logs: `docker-compose logs db`
- Verify connection string format in `docker-compose.yml`

### Want to Start Fresh?
```bash
docker-compose down -v  # Removes containers AND volumes
docker-compose up -d     # Creates fresh volumes
```

## Summary

✅ **Database data persists** - Users, posts, stories, etc. survive rebuilds
✅ **Uploaded files persist** - Images, videos survive rebuilds  
✅ **Automatic detection** - App uses database when available
✅ **No code changes needed** - Works automatically with Docker setup

Your data is now safe! 🎉

