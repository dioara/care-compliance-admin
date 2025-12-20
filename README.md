# Care Compliance Admin Portal

A separate owner admin portal for monitoring all organizations, users, subscriptions, and system metrics in the Care Compliance Management System.

## Features

- **Dashboard Overview**: Key metrics at a glance (total orgs, users, subscriptions)
- **Organizations Management**: View all registered organizations with user/location/staff counts
- **User Directory**: Browse all users across all organizations
- **Subscription Analytics**: Monitor subscription status, licenses, and expiring trials
- **Support Tickets**: View and manage support tickets from users

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Hono (Node.js)
- **Database**: MySQL (same database as main app - read-only access)
- **Charts**: Recharts
- **Auth**: JWT-based owner authentication

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/dioara/care-compliance-admin.git
   cd care-compliance-admin
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables:
   - `DATABASE_URL`: Your MySQL connection string (same as main app)
   - `OWNER_EMAIL`: Your owner login email
   - `OWNER_PASSWORD`: Your owner login password
   - `ADMIN_JWT_SECRET`: A secure random string for JWT signing

5. Run development server:
   ```bash
   pnpm dev
   ```

6. Open http://localhost:5173 in your browser

## Production Deployment

1. Build the application:
   ```bash
   pnpm build
   ```

2. Start the production server:
   ```bash
   pnpm start
   ```

The server will serve both the API and the static frontend from port 3001 (or your configured PORT).

## Security Notes

- This portal is designed for **owner access only**
- Uses a separate authentication system from the main app
- Connects to the same database but only performs **read operations**
- Should be deployed on a separate subdomain (e.g., admin.yourapp.com)
- Always use strong passwords and keep credentials secure

## Default Login

- Email: `owner@carecompliancesystem.com`
- Password: `OwnerAdmin2024!`

**Important**: Change these credentials in your `.env` file before deploying to production!
