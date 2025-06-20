# Cartridges Catalog

A modern web application for managing your video game collection with IGDB integration, built with Next.js, TypeScript, and PostgreSQL.

## Features

- 🎮 **Game Collection Management**: Track your owned and wishlisted games
- 🎯 **Platform Support**: Organize games by gaming platforms  
- 🔍 **IGDB Integration**: Automatic game details, covers, and metadata
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Dark/Light Theme**: Toggle between themes
- 🔐 **User Authentication**: Secure user accounts and data
- 📊 **Rich Filtering**: Filter games by genre, franchise, company, and more

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Material-UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **External APIs**: IGDB (Internet Game Database)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- IGDB API credentials

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cartridges-catalog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and API credentials
   ```

4. **Set up the database**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Deployment

This application is configured for deployment on AWS Amplify. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deployment Check

Run the deployment readiness script:

**Windows (PowerShell):**
```powershell
.\scripts\check-deployment.ps1
```

**Linux/macOS:**
```bash
chmod +x scripts/check-deployment.sh
./scripts/check-deployment.sh
```

## Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `IGDB_CLIENT_ID`: IGDB API client ID
- `IGDB_CLIENT_SECRET`: IGDB API client secret

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/user/*` - User data management
- `/api/platforms/*` - Platform data and browsing
- `/api/igdb/*` - IGDB integration
- `/api/admin/*` - Admin functionality

## Database

The application uses PostgreSQL with Prisma ORM. Database schema includes:

- **Users**: User accounts and authentication
- **Platforms**: Gaming platforms (consoles, handhelds, etc.)
- **Games**: User's game collection
- **IGDB Data**: Cached data from IGDB API

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

---

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
