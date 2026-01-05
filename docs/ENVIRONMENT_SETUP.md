# Environment Variables Setup Guide

## Overview
This project uses environment variables to store sensitive API keys and configuration. The `.env` file is **gitignored** and will never be committed to the repository.

## Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`

## Required Environment Variables

### Database
```
DATABASE_URL=postgresql://user:password@localhost:5432/cricsocial
```

### Cloudinary (Image/Video Storage)
Get your credentials from: https://cloudinary.com/console

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**How to find your Cloudinary credentials:**
1. Log in to https://cloudinary.com/console
2. Go to Dashboard
3. Under "Account Details" you'll find:
   - Cloud Name
   - API Key
   - API Secret

### Gemini AI
Get your API key from: https://aistudio.google.com/app/apikey

```
GEMINI_API_KEY=your_gemini_api_key
```

## Railway Deployment

When deploying to Railway, set these environment variables in the Railway dashboard:

1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Add each variable:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Railway provides this automatically for PostgreSQL |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `SESSION_SECRET` | A random secure string for sessions |
| `NODE_ENV` | Set to `production` |

### Railway-Specific Notes

- Railway automatically injects `DATABASE_URL` when you add a PostgreSQL database
- Environment variables in Railway are encrypted and secure
- They are never exposed in logs or the UI after being set
- Only your deployment can access them

## Security Best Practices

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Use different keys for dev/prod** - Create separate Cloudinary/Gemini accounts if needed
3. **Rotate keys periodically** - Especially if you suspect they've been exposed
4. **Use Railway's variable references** - For shared variables across services

## Fallback Behavior

The application has fallback behavior when services aren't configured:

| Service | Fallback |
|---------|----------|
| Cloudinary | Uses local file storage (`/public/uploads/`) |
| Gemini AI | Uses mock/placeholder responses |
| Redis | Uses in-memory caching |

## Verifying Configuration

After deployment, you can check if services are configured:

```bash
# Check storage status
GET /api/reels/storage/status

# Response when Cloudinary is configured:
{
  "storage": {
    "type": "cloudinary",
    "configured": true,
    "cloudinary": true
  },
  "message": "Using Cloudinary for media storage (CDN enabled)"
}
```
