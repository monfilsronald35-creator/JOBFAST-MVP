{
  "name": "jobfast-backend-core",
  "version": "2.2.0",
  "description": "JOBFAST GLOBAL MVP BACKEND",

  "private": true,

  "type": "module",

  "main": "src/server.js",

  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "build": "echo \"Build completed\""
  },

  "dependencies": {
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^4.21.2",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.6.2",
    "morgan": "^1.10.0"
  },

  "devDependencies": {
    "nodemon": "^3.1.4"
  },

  "engines": {
    "node": ">=18"
  },

  "keywords": [
    "jobfast",
    "backend",
    "express",
    "nodejs",
    "mongodb",
    "api",
    "global-platform"
  ],

  "author": "JOBFAST GLOBAL",

  "license": "MIT"
}