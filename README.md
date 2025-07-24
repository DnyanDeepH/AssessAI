# AssessAI Platform

AI-powered online assessment platform built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

- 🔐 Secure authentication and role-based access control
- 📝 Online exam creation and management
- 🤖 AI-powered question generation using Google Gemini
- 📊 Comprehensive analytics and reporting
- 📱 Responsive design for desktop and mobile
- 🛡️ Anti-cheating measures and secure exam environment

## Tech Stack

**Frontend:**

- React 18 with Vite
- Material-UI (MUI)
- Redux Toolkit
- React Router v6

**Backend:**

- Node.js with Express.js
- MongoDB with Mongoose
- JWT Authentication
- Google Gemini AI API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Google Gemini API key

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd assessai-platform
```

2. Install dependencies for all packages

```bash
npm run install:all
```

3. Set up environment variables

```bash
cp server/.env.example server/.env
# Edit server/.env with your configuration
```

4. Start the development servers

```bash
npm run dev
```

This will start:

- Backend server on http://localhost:5000
- Frontend client on http://localhost:3000

### Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/assessai
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
```

## Project Structure

```
assessai-platform/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/                 # Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── package.json
└── package.json           # Root package.json
```

## Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run server:dev` - Start only the backend server
- `npm run client:dev` - Start only the frontend client
- `npm run test` - Run tests for both client and server
- `npm run install:all` - Install dependencies for all packages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

//✅ Admin user created successfully!
📧 Email: admin@assessai.com
🔑 Password: admin123
