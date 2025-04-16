const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session'); 
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { userRouter } = require('./routes/user');
const { eventRouter } = require('./routes/event');
const { connectDB } = require('./routes/db');
require('dotenv').config();

// Initialize Express app
const app = express();

// ✅ CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL (Vite default)
  credentials: true,              // Allow cookies/auth headers
}));

// ✅ Middleware for JSON parsing
app.use(express.json());

// ✅ Session Middleware (required for Passport)
app.use(session({
  secret: process.env.JWT_SECRET || 'your-session-secret', // Use environment variable
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// ✅ Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ MongoDB User Schema from db.js - no need to redefine here

// ✅ Passport Google Strategy Configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID, // Use environment variable
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Use environment variable
  callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user in MongoDB
    const User = mongoose.model('user'); // Use the model from db.js
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName
      }).save();
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// ✅ Serialize and Deserialize User for Sessions
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const User = mongoose.model('user'); // Use the model from db.js
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ✅ Define Routes before connecting to DB
app.use('/user', userRouter);
app.use('/event', eventRouter);

// ✅ Google Authentication Routes
app.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
  (req, res) => {
    // Redirect to frontend dashboard on success
    res.redirect('http://localhost:5173/dashboard');
  }
);

// ✅ Get Current User (Protected Route)
app.get('/api/get-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      message: 'User data fetched successfully!'
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// ✅ Logout Route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.redirect('http://localhost:5173/');
  });
});

// ✅ Start Server with Error Handling
const PORT = process.env.PORT || 3000; // Using port 3000

// ✅ Connect to MongoDB and start server
async function startServer() {
  try {
    // Connect to MongoDB (this will continue even if connection fails)
    await connectDB();
    
    // Start Express server
    app.listen(PORT, (error) => {
      if (error) {
        console.error('❌ Server Start Error:', error);
        return;
      }
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ✅ Start the server
startServer();

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong on the server' });
});