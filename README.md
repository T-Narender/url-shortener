# URL Shortener

This project uses an Express/Node.js API, MySQL persistence, JWT authentication, and a React/Tailwind CSS frontend.

## Setup

1. Create the database and tables:

   ```bash
   mysql -u root -p < backend/schema.sql
   ```

2. Copy `backend/.env.example` to `backend/.env` and set the MySQL credentials and a strong `JWT_SECRET`.

3. Install frontend dependencies and build the frontend:

   ```bash
   cd frontend
   npm install
   npm run build
   ```

4. Install backend dependencies and start the API:

   ```bash
   cd ..
   cd backend
   npm install
   npm start
   ```

The API runs on `http://localhost:3000`. During frontend development, run `npm run dev` from `frontend`; Vite proxies API calls to the backend. The backend serves the built frontend from `frontend/dist` when that build exists.

## API

- `POST /api/auth/signup` - create a profile with `name`, `email`, and `password`
- `POST /api/auth/signin` - sign in and receive a JWT
- `GET /api/auth/me` - return the current authenticated profile
- `POST /shorten` - shorten a valid HTTP(S) URL; authenticated requests associate it with the profile
- `GET /api/urls` - list the current user's links (JWT required)
- `PATCH /api/urls/:shortId` - change a link's alias (JWT required)
- `DELETE /api/urls/:shortId` - delete one of the current user's links (JWT required)
- `GET /:shortId` - redirect to the original URL and increment its click count
