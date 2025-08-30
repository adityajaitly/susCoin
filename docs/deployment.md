# 🚀 susCoin Deployment Guide

## 🎯 **Deployment Overview**

This guide covers deploying susCoin from development to production, including **city-wide deployment** considerations.

---

## 🏗️ **System Architecture**

### **Current Stack**
- **Backend**: Node.js + Express.js
- **Database**: SQLite (dev) → PostgreSQL/MySQL (prod)
- **Frontend**: EJS + Tailwind CSS
- **Real-time**: Socket.IO
- **Process Manager**: PM2 (production)

### **Production Architecture**
```
Load Balancer → Web Servers → Database Cluster
     ↓              ↓            ↓
   Nginx        Node.js      PostgreSQL
   (SSL)       (PM2)        (Replica)
```

---

## 🔧 **Development to Production**

### **1. Environment Configuration**
```bash
# Create production environment file
cp .env.example .env.production

# Set production variables
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=suscoin_prod
DB_USER=suscoin_user
DB_PASSWORD=secure_password
JWT_SECRET=your_jwt_secret
```

### **2. Database Migration**
```bash
# Install production database
npm install pg mysql2

# Run migrations
npm run migrate:prod

# Seed production data
npm run seed:prod
```

### **3. Build Process**
```bash
# Build CSS for production
npm run build

# Install production dependencies
npm ci --only=production

# Start production server
npm start
```

---

## 🐳 **Docker Deployment**

### **Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build CSS
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### **Docker Compose**
```yaml
version: '3.8'
services:
  suscoin:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=suscoin_prod
      - POSTGRES_USER=suscoin_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## ☁️ **Cloud Deployment**

### **AWS Deployment**
```bash
# Install AWS CLI
aws configure

# Deploy to EC2
aws ec2 run-instances \
  --image-id ami-12345678 \
  --instance-type t3.medium \
  --key-name suscoin-key \
  --security-group-ids sg-12345678

# Configure load balancer
aws elbv2 create-load-balancer \
  --name suscoin-lb \
  --subnets subnet-12345678 subnet-87654321
```

### **Google Cloud Platform**
```bash
# Install gcloud CLI
gcloud init

# Deploy to App Engine
gcloud app deploy app.yaml

# Or deploy to Compute Engine
gcloud compute instances create suscoin-instance \
  --zone=us-central1-a \
  --machine-type=e2-medium
```

### **Azure Deployment**
```bash
# Install Azure CLI
az login

# Create resource group
az group create --name suscoin-rg --location eastus

# Deploy to App Service
az webapp create \
  --resource-group suscoin-rg \
  --plan suscoin-plan \
  --name suscoin-app
```

---

## 🏙️ **City Integration**

### **Transport API Integration**
```javascript
// Example: Opal Card integration
const opalIntegration = {
  // Real-time trip data
  getTripData: async (cardId) => {
    const response = await fetch(`https://api.opal.com.au/trips/${cardId}`);
    return response.json();
  },
  
  // Log trip to susCoin
  logTrip: async (tripData) => {
    const response = await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'transport',
        mode: tripData.mode,
        distanceKm: tripData.distance,
        evidenceUrl: tripData.receipt
      })
    });
    return response.json();
  }
};
```

### **Municipal System Integration**
```javascript
// Example: City dashboard integration
const cityDashboard = {
  // Get community impact
  getCommunityImpact: async () => {
    const response = await fetch('/api/community/impact');
    return response.json();
  },
  
  // Get user statistics
  getUserStats: async () => {
    const response = await fetch('/api/admin/users/stats');
    return response.json();
  }
};
```

---

## 📊 **Monitoring & Logging**

### **Application Monitoring**
```javascript
// PM2 ecosystem file
module.exports = {
  apps: [{
    name: 'suscoin',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### **Health Checks**
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: dbConnectionStatus
  };
  
  res.json(health);
});
```

---

## 🔐 **Security Configuration**

### **HTTPS Setup**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/path/to/private.key'),
  cert: fs.readFileSync('/path/to/certificate.crt')
};

https.createServer(options, app).listen(443);
```

### **Security Headers**
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
}));
```

---

## 📈 **Scaling Considerations**

### **Horizontal Scaling**
```javascript
// Redis session store for multiple instances
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({
    host: 'localhost',
    port: 6379
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
```

### **Database Scaling**
```sql
-- Read replicas for scaling
CREATE DATABASE suscoin_read_replica;
-- Configure connection pooling
-- Implement database sharding for multi-city
```

---

## 🚨 **Disaster Recovery**

### **Backup Strategy**
```bash
#!/bin/bash
# Daily backup script
DATE=$(date +%Y%m%d)
pg_dump suscoin_prod > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://suscoin-backups/
```

### **Recovery Procedures**
```bash
# Database recovery
psql suscoin_prod < backup_20250830.sql

# Application restart
pm2 restart suscoin

# Verify system health
curl http://localhost:3000/health
```

---

## 📋 **Deployment Checklist**

### **Pre-Deployment**
- [ ] **Environment variables** configured
- [ ] **Database migrations** tested
- [ ] **Security audit** completed
- [ ] **Load testing** performed
- [ ] **Backup procedures** verified

### **Deployment**
- [ ] **Code deployed** to production
- [ ] **Database updated** with migrations
- [ ] **SSL certificates** installed
- [ ] **Monitoring** configured
- [ ] **Health checks** passing

### **Post-Deployment**
- [ ] **User acceptance testing** completed
- [ ] **Performance monitoring** active
- [ ] **Error logging** configured
- [ ] **Backup verification** successful
- [ ] **Documentation** updated

---

## 🎯 **City Deployment Timeline**

### **Week 1: Infrastructure**
- Set up production servers
- Configure load balancers
- Install SSL certificates

### **Week 2: Application**
- Deploy susCoin application
- Configure production database
- Set up monitoring and logging

### **Week 3: Integration**
- Integrate with city transport APIs
- Configure partner systems
- Test end-to-end workflows

### **Week 4: Launch**
- User acceptance testing
- Staff training
- Public launch

---

**🚀 susCoin is production-ready with comprehensive deployment options for city-wide sustainability rewards deployment.**
