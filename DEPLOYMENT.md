# AWS Amplify Deployment Guide

This guide will help you deploy your Cartridges Catalog application to AWS Amplify.

## Prerequisites

1. **AWS Account**: Make sure you have an AWS account
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Database**: You'll need a PostgreSQL database (we recommend AWS RDS)

## Step 1: Prepare Your Database

### Option A: AWS RDS PostgreSQL (Recommended)
1. Go to AWS RDS Console
2. Create a new PostgreSQL database
3. Choose the appropriate instance size (db.t3.micro for testing)
4. Configure security groups to allow connections from Amplify
5. Note the connection string

### Option B: External Database (Supabase, PlanetScale, etc.)
1. Create a PostgreSQL database on your preferred provider
2. Get the connection string

## Step 2: Set Up AWS Amplify

1. **Go to AWS Amplify Console**
   - Navigate to https://console.aws.amazon.com/amplify/

2. **Connect Your Repository**
   - Click "New app" → "Host web app"
   - Choose GitHub and authorize AWS Amplify
   - Select your repository and branch (usually `main` or `master`)

3. **Configure Build Settings**
   - Amplify should auto-detect the `amplify.yml` file
   - If not, paste the contents from the `amplify.yml` file in your repo

4. **Set Environment Variables**
   Go to App settings → Environment variables and add:
   ```
   DATABASE_URL=your-database-connection-string
   JWT_SECRET=your-random-jwt-secret-here
   IGDB_CLIENT_ID=your-igdb-client-id
   IGDB_CLIENT_SECRET=your-igdb-client-secret
   NEXTAUTH_URL=https://your-app-id.amplifyapp.com
   NEXTAUTH_SECRET=your-nextauth-secret
   ```

## Step 3: Deploy

1. **Initial Deployment**
   - Click "Save and deploy"
   - The build process will take 5-10 minutes

2. **Run Database Migrations**
   - After the first deployment, you need to run migrations
   - You can do this by connecting to your database directly and running:
     ```sql
     -- Your migration SQL from prisma/migrations/
     ```
   - Or set up a one-time build that runs `npx prisma migrate deploy`

## Step 4: Post-Deployment Setup

1. **Custom Domain (Optional)**
   - Go to Domain management in Amplify
   - Add your custom domain

2. **SSL Certificate**
   - Amplify automatically provides SSL certificates

3. **Test Your Application**
   - Visit your Amplify URL
   - Test user registration/login
   - Test game and platform functionality

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for signing JWT tokens | `your-super-secret-jwt-key` |
| `IGDB_CLIENT_ID` | IGDB API client ID | `your-igdb-client-id` |
| `IGDB_CLIENT_SECRET` | IGDB API client secret | `your-igdb-client-secret` |
| `NEXTAUTH_URL` | Your app's URL | `https://main.d1234567890.amplifyapp.com` |
| `NEXTAUTH_SECRET` | NextAuth secret | `your-nextauth-secret` |

## Troubleshooting

### Build Fails
- Check the build logs in Amplify console
- Ensure all environment variables are set correctly
- Verify your database is accessible

### Database Connection Issues
- Check your DATABASE_URL format
- Ensure your database allows connections from Amplify IPs
- Verify database credentials

### IGDB API Issues
- Verify your IGDB client ID and secret
- Check if IGDB API is accessible from AWS

### Runtime Errors
- Check the function logs in CloudWatch
- Verify all environment variables are available at runtime

## Monitoring

- Use AWS CloudWatch for application logs
- Monitor database performance in RDS console
- Set up Amplify monitoring for app performance

## Security Considerations

1. **Database Security**
   - Use SSL connections
   - Restrict database access to necessary IPs
   - Use strong passwords

2. **Environment Variables**
   - Never commit secrets to Git
   - Use AWS Parameter Store for sensitive data if needed

3. **API Security**
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS only
