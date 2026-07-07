# 🎥 Video Streaming Platform - YouTube Clone Backend API

A scalable **YouTube-inspired backend application** built with **Node.js, Express.js, MongoDB, and Mongoose**. The project provides secure authentication, video management, and social interaction features through RESTful APIs, following industry-standard backend development practices.

## 🏗️ System Architecture

**Architecture Diagram:**  
🔗 https://app.eraser.io/workspace/xloQG2vOVNTa4u4qOfsc?origin=share

The architecture diagram illustrates the complete backend workflow, including authentication, API request flow, Cloudinary integration, MongoDB data models, and relationships between Users, Videos, Comments, Likes, Playlists, and Subscriptions.

---

## 🚀 Features

- User Registration & Login
- JWT Authentication (Access & Refresh Tokens)
- Secure Password Hashing with bcrypt
- Video Upload & Management
- Cloudinary Integration for Video & Image Storage
- Avatar & Cover Image Upload
- Thumbnail Upload
- Like & Unlike Videos
- Comment on Videos
- Subscribe & Unsubscribe to Channels
- Playlist Management
- Watch History
- Search, Filter & Sort Videos
- Pagination
- User Profile Management
- Protected Routes
- Centralized Error Handling
- Modular MVC Architecture

---

## 🛠️ Tech Stack

### Backend

- Node.js
- Express.js

### Database

- MongoDB
- Mongoose

### Authentication & Security

- JWT
- bcrypt
- Cookie Parser
- CORS

### File Storage

- Cloudinary
- Multer

### Development Tools

- dotenv
- Nodemon
- Postman

### Database Optimization

- MongoDB Aggregation Pipeline
- MongoDB Atlas Search
- Pagination
- $lookup

---

## 📂 Project Structure

```text
VideoTube/
│
├── public/
│
├── src/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── constants.js
│   ├── app.js
│   └── index.js
│
├── .env
├── package.json
└── README.md
```

---

## 📦 Database Collections

- Users
- Videos
- Comments
- Likes
- Playlists
- Subscriptions
- Tweets
- Watch History

---

## 🔑 Authentication

The application uses JWT-based authentication.

- Access Token
- Refresh Token
- HTTP-only Cookies
- Protected Routes
- bcrypt Password Hashing

---

## 📹 Video Management

Users can

- Upload Videos
- Update Videos
- Delete Videos
- Publish / Unpublish Videos
- Search Videos
- Filter Videos
- Stream Videos

---

## 👤 User Features

- Register
- Login
- Logout
- Update Profile
- Change Password
- Update Avatar
- Update Cover Image
- View Channel Profile
- Watch History

---

## ❤️ Social Features

- Like Videos
- Unlike Videos
- Add Comments
- Subscribe to Channels
- Manage Playlists

---

## ⚡ Performance Optimizations

- MongoDB Aggregation Pipelines
- Pagination
- Sorting
- Filtering
- MongoDB `$lookup`
- MongoDB Atlas Search
- Optimized Queries

---

## 📡 API Modules

- Authentication APIs
- User APIs
- Video APIs
- Comment APIs
- Like APIs
- Playlist APIs
- Subscription APIs
- Dashboard APIs

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/nitinkumar9877/VideoTube.git
```

### Navigate to Project

```bash
cd VideoTube
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the root directory.

```env
PORT=8000

MONGODB_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_access_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CORS_ORIGIN=http://localhost:5173
```

### Start Development Server

```bash
npm run dev
```

---

## 🧪 API Testing

The REST APIs can be tested using:

- Postman
- Thunder Client
- Insomnia

---

## 📈 Future Improvements

- Live Video Streaming
- AI-based Video Recommendations
- Notification System
- Watch Later
- Download Videos
- Admin Dashboard
- Trending Videos
- Video Analytics
- Real-time Chat
- Content Moderation

---

## 🎯 Learning Outcomes

This project demonstrates practical experience in:

- Backend Development with Node.js & Express.js
- REST API Design
- Authentication & Authorization
- MongoDB Database Design
- Mongoose Data Modeling
- Cloudinary Media Management
- File Upload Handling
- MVC Architecture
- Aggregation Pipelines
- Scalable Backend Development
- Production-ready API Development

---

## 👨‍💻 Author

**Nitin Kumar**

- **GitHub:** https://github.com/nitinkumar9877
- **LinkedIn:** https://www.linkedin.com/in/nitin-kumar-145s5004/

---

## 📄 License

This project is developed for educational and portfolio purposes.
