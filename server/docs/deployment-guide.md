# AssessAI Platform Deployment Guide

This guide provides instructions for deploying the AssessAI platform to a production environment.

## Prerequisites

- Node.js 16.x or higher
- MongoDB 5.x or higher
- npm or yarn package manager
- A domain name (for production deployment)
- SSL certificate (for HTTPS)
- Google Cloud Platform account (for Gemini API)

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-organization/assessai-platform.git
cd assessai-platform
```

### 2. Configure Environment Variables

Create production environment files:

```bash
cp server/.env.example server/.env.production
cp client/.env.example client/.env.production
```

Edit the environment files with your production settings:

**Server Environment Variables (`server/.env.production`):**

```
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/assessai?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-make-it-different-and-long
JWT_REFRESH_EXPIRE=7d

# Client Configuration
CLIENT_URL=https://your-domain.com

# Google Gemini API (for AI features)
GEMINI_API_KEY=your-gemini-api-key

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Client Environment Variables (`client/.env.production`):**

```
VITE_API_BASE_URL=https://api.your-domain.com/api
```

### 3. Install Dependencies

Install server dependencies:

```bash
cd server
npm install --production
```

Install client dependencies and build:

```bash
cd ../client
npm install
npm run build
```

## Database Setup

### 1. Set Up MongoDB Atlas (Recommended for Production)

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Configure network access to allow connections from your deployment server
4. Create a database user with read/write permissions
5. Get your connection string and update the `MONGODB_URI` in your environment file

### 2. Database Indexes

For optimal performance, set up the following indexes in your MongoDB database:

```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Questions collection
db.questions.createIndex({ topic: 1 });
db.questions.createIndex({ difficulty: 1 });
db.questions.createIndex({ isActive: 1 });
db.questions.createIndex({ questionText: "text" });

// Exams collection
db.exams.createIndex({ startTime: 1, endTime: 1 });
db.exams.createIndex({ assignedTo: 1 });
db.exams.createIndex({ createdBy: 1 });

// Submissions collection
db.submissions.createIndex({ examId: 1, studentId: 1 }, { unique: true });
db.submissions.createIndex({ submittedAt: -1 });
```

## Deployment Options

### Option 1: Traditional VPS/Dedicated Server

#### Server Setup

1. Set up a Linux server (Ubuntu 20.04 LTS recommended)
2. Install Node.js, npm, and MongoDB
3. Set up Nginx as a reverse proxy
4. Configure SSL with Let's Encrypt
5. Use PM2 for process management

#### Nginx Configuration

Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/assessai
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com;";

    # API server
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static client files
    location / {
        root /var/www/assessai/client/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/assessai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### PM2 Configuration

Create a PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

Add the following configuration:

```javascript
module.exports = {
  apps: [
    {
      name: "assessai-api",
      script: "./server/server.js",
      instances: "max",
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      watch: false,
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      merge_logs: true,
    },
  ],
};
```

Start the application:

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile for Server

```bash
nano server/Dockerfile
```

Add the following:

```dockerfile
FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

#### 2. Create Dockerfile for Client

```bash
nano client/Dockerfile
```

Add the following:

```dockerfile
FROM node:16-alpine as build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create Nginx configuration for the client:

```bash
nano client/nginx.conf
```

Add the following:

```nginx
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;

    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

#### 3. Create Docker Compose File

```bash
nano docker-compose.yml
```

Add the following:

```yaml
version: "3"

services:
  mongodb:
    image: mongo:5
    container_name: assessai-mongodb
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    networks:
      - assessai-network

  api:
    build: ./server
    container_name: assessai-api
    restart: always
    depends_on:
      - mongodb
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongodb:27017/assessai?authSource=admin
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRE=${JWT_EXPIRE}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - JWT_REFRESH_EXPIRE=${JWT_REFRESH_EXPIRE}
      - CLIENT_URL=${CLIENT_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - MAX_FILE_SIZE=${MAX_FILE_SIZE}
      - UPLOAD_PATH=${UPLOAD_PATH}
      - BCRYPT_ROUNDS=${BCRYPT_ROUNDS}
      - RATE_LIMIT_WINDOW_MS=${RATE_LIMIT_WINDOW_MS}
      - RATE_LIMIT_MAX_REQUESTS=${RATE_LIMIT_MAX_REQUESTS}
    volumes:
      - ./server/uploads:/usr/src/app/uploads
      - ./server/logs:/usr/src/app/logs
    networks:
      - assessai-network

  client:
    build: ./client
    container_name: assessai-client
    restart: always
    depends_on:
      - api
    networks:
      - assessai-network

  nginx:
    image: nginx:alpine
    container_name: assessai-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - api
      - client
    networks:
      - assessai-network

networks:
  assessai-network:
    driver: bridge

volumes:
  mongodb_data:
```

#### 4. Create Nginx Configuration for Docker

```bash
mkdir -p nginx/conf
nano nginx/conf/default.conf
```

Add the following:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com;";

    # API server
    location /api {
        proxy_pass http://api:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://api:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static client files
    location / {
        proxy_pass http://client:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. Deploy with Docker Compose

```bash
docker-compose up -d
```

### Option 3: Cloud Deployment

#### AWS Elastic Beanstalk

1. Install the EB CLI:

   ```bash
   pip install awsebcli
   ```

2. Initialize EB application:

   ```bash
   eb init
   ```

3. Create an environment:

   ```bash
   eb create production
   ```

4. Deploy the application:
   ```bash
   eb deploy
   ```

#### Google Cloud Run

1. Build and push Docker images to Google Container Registry:

   ```bash
   gcloud builds submit --tag gcr.io/your-project/assessai-api ./server
   gcloud builds submit --tag gcr.io/your-project/assessai-client ./client
   ```

2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy assessai-api --image gcr.io/your-project/assessai-api --platform managed
   gcloud run deploy assessai-client --image gcr.io/your-project/assessai-client --platform managed
   ```

## Monitoring and Logging

### Setting Up Monitoring

#### 1. Health Check Endpoint

The application includes a `/health` endpoint that returns the current status of the API server. You can use this endpoint with monitoring tools to check if the service is running.

#### 2. Prometheus and Grafana

For advanced monitoring, set up Prometheus and Grafana:

1. Install Prometheus Node Exporter on your server
2. Configure Prometheus to scrape metrics from your application
3. Set up Grafana dashboards to visualize the metrics

#### 3. Error Logging

The application uses Winston for logging. Logs are stored in the `logs` directory:

- `api-error.log`: Error logs
- `api-out.log`: Standard output logs

For production, consider using a centralized logging solution like ELK Stack (Elasticsearch, Logstash, Kibana) or a cloud-based logging service.

## Backup and Recovery

### Database Backup

Set up automated MongoDB backups:

```bash
# Create backup script
nano backup.sh
```

Add the following:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups"
MONGO_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/assessai"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Compress backup
tar -zcvf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" "$BACKUP_DIR/backup_$TIMESTAMP"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/backup_$TIMESTAMP"

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.tar.gz" -type f -mtime +30 -delete
```

Make the script executable:

```bash
chmod +x backup.sh
```

Set up a cron job to run the backup script daily:

```bash
crontab -e
```

Add the following line:

```
0 2 * * * /path/to/backup.sh >> /path/to/backup.log 2>&1
```

### File Backup

Set up automated file backups for uploaded files:

```bash
# Create backup script
nano file-backup.sh
```

Add the following:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/file-backups"
SOURCE_DIR="/path/to/uploads"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
tar -zcvf "$BACKUP_DIR/files_$TIMESTAMP.tar.gz" "$SOURCE_DIR"

# Remove backups older than 30 days
find $BACKUP_DIR -name "files_*.tar.gz" -type f -mtime +30 -delete
```

Make the script executable:

```bash
chmod +x file-backup.sh
```

Set up a cron job to run the backup script daily:

```bash
crontab -e
```

Add the following line:

```
0 3 * * * /path/to/file-backup.sh >> /path/to/file-backup.log 2>&1
```

## Security Considerations

### 1. Keep Dependencies Updated

Regularly update dependencies to patch security vulnerabilities:

```bash
npm audit
npm update
```

### 2. Set Up Security Headers

Ensure proper security headers are set in your Nginx configuration:

- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy

### 3. Implement Rate Limiting

The application includes rate limiting middleware to prevent abuse. Configure the rate limits in your environment variables:

```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Regular Security Audits

Perform regular security audits:

- Run vulnerability scanners
- Review access logs for suspicious activity
- Check for outdated dependencies
- Review authentication and authorization mechanisms

## Troubleshooting

### Common Issues and Solutions

#### 1. MongoDB Connection Issues

**Issue**: Unable to connect to MongoDB

**Solution**:

- Check if MongoDB is running
- Verify the connection string in your environment file
- Ensure network access is configured correctly
- Check MongoDB logs for errors

#### 2. API Server Not Starting

**Issue**: API server fails to start

**Solution**:

- Check server logs for errors
- Verify environment variables are set correctly
- Ensure required ports are available
- Check for syntax errors in code

#### 3. Client-Side Issues

**Issue**: Client application not loading or showing errors

**Solution**:

- Check browser console for errors
- Verify API base URL is set correctly in client environment
- Ensure client build was successful
- Check Nginx configuration for client routing

## Maintenance

### Regular Maintenance Tasks

1. **Update Dependencies**: Regularly update npm packages to get security patches and bug fixes
2. **Database Maintenance**: Run database optimization commands periodically
3. **Log Rotation**: Set up log rotation to prevent disk space issues
4. **Monitoring**: Regularly check monitoring dashboards for issues
5. **Backups**: Verify backup processes are working correctly

## Support

For additional support, contact the AssessAI development team at support@assessai.com or open an issue on the GitHub repository.
