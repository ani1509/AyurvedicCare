# Ayurvedic Consultation Platform
 
A comprehensive full-stack platform for connecting patients with Ayurvedic doctors for consultations, built with React.js, Node.js, Express, and MongoDB.
 
## 🚀 Features
 
### For Patients
- **Doctor Discovery**: Search and filter doctors by specialization, location, consultation mode, and availability
- **Slot Booking**: Lock slots for 5 minutes with OTP confirmation
- **Appointment Management**: View, cancel, and reschedule appointments
- **Rating System**: Rate and review completed consultations
- **Real-time Availability**: See real-time slot availability
 
### For Doctors
- **Profile Management**: Create and manage detailed profiles with qualifications
- **Availability Management**: Set weekly schedules and consultation modes
- **Appointment Dashboard**: View and manage patient appointments
- **Consultation Records**: Maintain patient consultation history
- **Rating Analytics**: Track patient ratings and reviews
 
### Core Features
- **Authentication**: JWT-based secure authentication
- **Role-based Access**: Separate interfaces for patients and doctors
- **Slot Locking**: 5-minute slot reservation system
- **Cancellation Policy**: 24-hour cancellation window
- **Responsive Design**: Mobile-first responsive UI
- **Real-time Updates**: Live slot availability updates
 
## 🛠️ Tech Stack
 
### Frontend
- **React.js** - UI framework
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
 
### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
 
## 📋 Prerequisites
 
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
 
## 🚀 Installation
 
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ayurvedic-consultation-platform
   ```
 
2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```
 
3. **Environment Setup**
   ```bash
   # Copy environment template
   cd ../server
   cp env.example .env
   
   # Edit .env file with your configuration
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ayurvedic_platform
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```
 
4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```
 
5. **Run the application**
   ```bash
   # From root directory
   npm run dev
   
   # Or run separately:
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm start
   ```
 
6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
 
## 📁 Project Structure
 
```
ayurvedic-consultation-platform/
├── server/
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── index.js          # Server entry point
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   ├── App.js        # Main app component
│   │   └── index.js      # React entry point
│   └── package.json
└── package.json
```
 
## 🔧 API Endpoints
 
### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password
 
### Doctors
- `GET /api/doctors` - Get all doctors with filters
- `GET /api/doctors/:id` - Get doctor details
- `POST /api/doctors` - Create doctor profile
- `PUT /api/doctors/profile` - Update doctor profile
- `PUT /api/doctors/availability` - Update availability
 
### Slots
- `POST /api/slots/lock` - Lock a slot
- `POST /api/slots/unlock` - Unlock a slot
- `POST /api/slots/book` - Book a slot
- `GET /api/slots/doctor/:id` - Get doctor slots
- `GET /api/slots/my-locked` - Get locked slots
 
### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - Get appointments
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/reschedule` - Reschedule appointment
- `PUT /api/appointments/:id/complete` - Complete appointment
- `POST /api/appointments/:id/rate` - Rate appointment
 
## 🧪 Testing
 
```bash
# Run backend tests
cd server
npm test
 
# Run frontend tests
cd client
npm test
```
 
## 🚀 Deployment
 
### Backend Deployment
1. Set up MongoDB Atlas or your preferred MongoDB hosting
2. Deploy to Heroku, Vercel, or your preferred platform
3. Set environment variables in production
 
### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Netlify, Vercel, or your preferred platform
3. Update API base URL for production
 
## 🔒 Security Features
 
- JWT authentication with secure token storage
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- Rate limiting
- Role-based access control
 
## 📱 Responsive Design
 
The application is fully responsive and optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)
 
## 🤝 Contributing
 
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
 
## 📄 License
 
This project is licensed under the MIT License.
 
---
 
## 🧠 Developer Thinking Test: Scaling to 5,000 Appointments/Day
 
### Current Architecture Analysis
 
**Current System:**
- Single Node.js server
- MongoDB single instance
- Basic authentication and authorization
- Simple slot booking system
 
### Scaling Strategy for 5,000 Appointments/Day
 
#### 1. **API Layer Scaling**
 
**Current Issues:**
- Single server bottleneck
- No load balancing
- Synchronous slot operations
 
**Solutions:**
```javascript
// Implement microservices architecture
- Appointment Service (handles booking logic)
- User Service (authentication & profiles)
- Notification Service (SMS/email)
- Payment Service (payment processing)
- Analytics Service (metrics & reporting)
 
// Load balancing with Nginx
upstream api_servers {
    server api1:3000;
    server api2:3000;
    server api3:3000;
    server api4:3000;
}
```
 
#### 2. **Database Scaling**
 
**Current Issues:**
- Single MongoDB instance
- No read/write separation
- Limited connection pooling
 
**Solutions:**
```javascript
// MongoDB Replica Set
- Primary: Write operations
- Secondary: Read operations
- Arbiter: Failover coordination
 
// Sharding Strategy
- Shard by doctor_id (geographic distribution)
- Shard by date (time-based distribution)
 
// Connection Pooling
const mongoose = require('mongoose');
mongoose.connect(uri, {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 30000
});
```
 
#### 3. **Slot Management Optimization**
 
**Current Issues:**
- Synchronous slot locking
- Database contention
- No caching
 
**Solutions:**
```javascript
// Redis for slot caching
const redis = require('redis');
const client = redis.createClient();
 
// Cache slot availability
async function cacheSlots(doctorId, date, slots) {
  const key = `slots:${doctorId}:${date}`;
  await client.setex(key, 3600, JSON.stringify(slots));
}
 
// Optimistic locking for slot booking
async function bookSlot(slotId, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();
 
  try {
    const slot = await Slot.findById(slotId).session(session);
    if (slot.status !== 'available') {
      throw new Error('Slot not available');
    }
   
    slot.status = 'booked';
    slot.bookedBy = { userId, bookedAt: new Date() };
    await slot.save({ session });
   
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```
 
#### 4. **Queue System for High Load**
 
```javascript
// Bull Queue for background jobs
const Queue = require('bull');
 
const appointmentQueue = new Queue('appointments', {
  redis: {
    host: 'redis-server',
    port: 6379
  }
});
 
// Process appointments asynchronously
appointmentQueue.process(async (job) => {
  const { appointmentData } = job.data;
 
  // Create appointment
  const appointment = new Appointment(appointmentData);
  await appointment.save();
 
  // Send notifications
  await sendNotification(appointment);
 
  // Update analytics
  await updateAnalytics(appointment);
});
```
 
#### 5. **Caching Strategy**
 
```javascript
// Multi-level caching
const cache = {
  L1: new Map(), // In-memory cache
  L2: redis,     // Redis cache
  L3: mongodb    // Database
};
 
async function getDoctorSlots(doctorId, date) {
  // L1 Cache
  const l1Key = `slots:${doctorId}:${date}`;
  if (cache.L1.has(l1Key)) {
    return cache.L1.get(l1Key);
  }
 
  // L2 Cache
  const l2Data = await cache.L2.get(l1Key);
  if (l2Data) {
    cache.L1.set(l1Key, JSON.parse(l2Data));
    return JSON.parse(l2Data);
  }
 
  // L3 Cache (Database)
  const slots = await Slot.find({ doctorId, date });
  const data = JSON.stringify(slots);
 
  // Update caches
  cache.L1.set(l1Key, slots);
  await cache.L2.setex(l1Key, 300, data);
 
  return slots;
}
```
 
#### 6. **Monitoring & Analytics**
 
```javascript
// Prometheus metrics
const prometheus = require('prom-client');
 
const appointmentCounter = new prometheus.Counter({
  name: 'appointments_total',
  help: 'Total number of appointments'
});
 
const bookingDuration = new prometheus.Histogram({
  name: 'booking_duration_seconds',
  help: 'Time taken to book appointment'
});
 
// Application monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    bookingDuration.observe(duration);
  });
  next();
});
```
 
#### 7. **Infrastructure Requirements**
 
**Estimated Resources for 5,000 appointments/day:**
 
```yaml
# Docker Compose for production
version: '3.8'
services:
  api:
    image: ayurvedic-api
    replicas: 8
    resources:
      limits:
        memory: 1G
        cpus: '0.5'
 
  mongodb:
    image: mongo:5.0
    replicas: 3
    resources:
      limits:
        memory: 2G
        cpus: '1.0'
 
  redis:
    image: redis:6.2
    replicas: 2
    resources:
      limits:
        memory: 512M
        cpus: '0.25'
 
  nginx:
    image: nginx:alpine
    replicas: 2
```
 
#### 8. **Performance Optimizations**
 
```javascript
// Database indexing
db.slots.createIndex({ doctorId: 1, date: 1, status: 1 });
db.slots.createIndex({ "lockedBy.expiresAt": 1 });
db.appointments.createIndex({ patientId: 1, appointmentDate: -1 });
db.appointments.createIndex({ doctorId: 1, appointmentDate: -1 });
 
// Connection pooling
const pool = new Pool({
  host: 'localhost',
  database: 'ayurvedic_platform',
  user: 'username',
  password: 'password',
  max: 100,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
 
// Query optimization
const slots = await Slot.find({
  doctorId,
  date: { $gte: startDate, $lte: endDate },
  status: 'available'
})
.select('startTime endTime consultationMode')
.lean()
.exec();
```
 
### Expected Performance Metrics
 
**Target Metrics:**
- Response Time: < 200ms (95th percentile)
- Throughput: 100+ requests/second
- Uptime: 99.9%
- Error Rate: < 0.1%
 
**Monitoring Dashboard:**
- Real-time appointment booking rate
- Database query performance
- Cache hit rates
- Error rates and types
- User session analytics
 
This scaling strategy ensures the platform can handle 5,000 appointments/day while maintaining performance, reliability, and user experience.
 