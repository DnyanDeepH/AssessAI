# AssessAI Platform - Vercel Deployment Guide

## Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Atlas**: Set up a MongoDB Atlas cluster for production database
4. **Google Gemini API Key**: Get your API key from Google Cloud Console

## Step-by-Step Deployment

### 1. Prepare Your Code

Make sure all the configuration files are in place:

- ✅ `vercel.json`
- ✅ `api/index.js`
- ✅ `client/.env.production`
- ✅ `.vercelignore`

### 2. Push to GitHub

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a monorepo

### 4. Configure Environment Variables

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

#### Production Environment Variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/assessai?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRE=1h
JWT_REFRESH_SECRET=your-different-super-secret-refresh-key-minimum-32-characters
JWT_REFRESH_EXPIRE=7d
GEMINI_API_KEY=your-google-gemini-api-key
CLIENT_URL=https://your-vercel-app-name.vercel.app
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### For the Frontend (Client):

```
VITE_API_BASE_URL=/api
```

### 5. MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist Vercel's IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string and update `MONGODB_URI`

### 6. Google Gemini API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Gemini API
4. Create credentials (API Key)
5. Add the API key to `GEMINI_API_KEY` environment variable

## Project Structure for Vercel

```
your-project/
├── api/
│   └── index.js          # Serverless API entry point
├── client/               # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.production
├── server/               # Express backend
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── server.js
├── vercel.json          # Vercel configuration
└── .vercelignore        # Files to ignore during deployment
```

## Deployment Process

1. **Frontend Build**: Vercel builds the React app using `npm run vercel-build`
2. **API Deployment**: The Express server runs as serverless functions
3. **Routing**: `/api/*` routes go to the backend, everything else to the frontend

## Post-Deployment Checklist

- [ ] Test user registration and login
- [ ] Test exam creation and taking
- [ ] Test AI question generation (upload documents)
- [ ] Check database connections
- [ ] Test file uploads
- [ ] Verify security headers and CORS
- [ ] Test rate limiting

## Troubleshooting

### Common Issues:

1. **Database Connection Error**:

   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Ensure database user has proper permissions

2. **API Routes Not Working**:

   - Check `vercel.json` routing configuration
   - Verify `api/index.js` is properly exporting the Express app

3. **Environment Variables Not Loading**:

   - Make sure all environment variables are set in Vercel dashboard
   - Restart deployment after adding new variables

4. **Build Failures**:
   - Check for TypeScript errors
   - Ensure all dependencies are in `package.json`
   - Check build logs in Vercel dashboard

### Logs and Monitoring:

- Use Vercel's Function logs to debug API issues
- Check Network tab in browser for failed API calls
- Monitor database connections in MongoDB Atlas

## Custom Domain (Optional)

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update CLIENT_URL environment variable to your custom domain

## Security Considerations

- All sensitive data is in environment variables
- HTTPS is automatically enabled by Vercel
- Rate limiting is configured for API protection
- CORS is configured for your domain only
