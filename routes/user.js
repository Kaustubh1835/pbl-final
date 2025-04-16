const { Router } = require('express');
const { z } = require('zod');
const { userModel } = require('./db');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const jwkToPem = require('jwk-to-pem');
const bcrypt = require('bcrypt');
const express = require('express');
const cors = require('cors');

require('dotenv').config(); // Load environment variables

const app = express();
const userRouter = Router();

app.use(express.json()); // Parse JSON bodies
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend origin
}));

// JWT Secret (should be in .env for security)
const JWT_SECRET = process.env.JWT_SECRET || 'your-strong-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';
const REDIRECT_URI = 'http://localhost:3000/user/auth/google/callback';

// Fetch Google's JWKS for token verification
let googlePem = null;
async function getGooglePublicKey(kid) {
  if (!googlePem) {
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/certs');
    const jwk = response.data.keys.find(key => key.kid === kid);
    if (!jwk) throw new Error('No matching JWK found');
    googlePem = jwkToPem(jwk);
  }
  return googlePem;
}

// ✅ Email/Password Signup Route with Logging
userRouter.post('/signup', async function (req, res) {
  const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  });

  const { email, password, firstName, lastName } = req.body;

  const validation = userSchema.safeParse({ email, password, firstName, lastName });
  if (!validation.success) {
    console.log('Validation failed:', validation.error.errors);
    return res.status(400).json({
      msg: 'Validation error',
      errors: validation.error.errors,
    });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      console.log('Signup failed: Email already in use:', email);
      return res.status(409).json({ msg: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Creating new user with email:', email);
    const user = await userModel.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user',
    });

    const token = jwt.sign({
      id: user._id,
      name: user.firstName + ' ' + user.lastName,
      email: user.email,
      role: user.role,
    }, JWT_SECRET);

    console.log('Signup successful, token generated:', token);
    res.json({ msg: 'Signup successful', token });
  } catch (error) {
    console.error('Signup error:', error.message, error);
    return res.status(500).json({
      msg: 'Error creating user',
      error: error.message,
    });
  }
});

// ✅ Email/Password Signin Route with Logging
userRouter.post('/signin', async function (req, res) {
  const { email, password } = req.body;
  console.log('Signin request received:', { email });
  
  

  try {
    const user = await userModel.findOne({ email });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({
        id: user._id,
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        role: user.role,
      }, JWT_SECRET);

      console.log('Signin successful, token generated:', token);
      res.json({ token });
    } else {
      console.log('Signin failed: Invalid credentials for email:', email);
      res.status(401).json({ msg: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Signin error:', error.message, error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// ✅ Google Auth Routes with Custom Implementation
userRouter.get('/auth/google', (req, res) => {
  console.log('Initiating Google OAuth request - /auth/google:', req.query);
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.append('redirect_uri', REDIRECT_URI);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'profile email');
  url.searchParams.append('state', 'random_state_string'); // Add state for security (optional but recommended)
  res.redirect(url.toString());
});

userRouter.get('/auth/google/callback', async (req, res) => {
  console.log('Google OAuth callback received - /auth/google/callback:', req.query);
  const { code, state } = req.query;

  if (!code) {
    console.log('No authorization code received in callback');
    return res.redirect('http://localhost:5173/login?error=no_code');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { id_token, access_token } = tokenResponse.data;
    console.log('Tokens received:', { id_token, access_token });

    // Decode and verify ID token
    const decodedToken = jwt.decode(id_token, { complete: true });
    if (!decodedToken) throw new Error('Invalid ID token');

    const kid = decodedToken.header.kid;
    const pem = await getGooglePublicKey(kid);
    const verifiedToken = jwt.verify(id_token, pem, {
      issuer: 'https://accounts.google.com',
      audience: GOOGLE_CLIENT_ID,
    });

    console.log('Verified Google ID Token:', verifiedToken);

    const { email, given_name: firstName, family_name: lastName } = verifiedToken;
    let user = await userModel.findOne({ email });

    if (!user) {
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        console.log('Linking Google account to existing user with email:', email);
        existingUser.googleId = verifiedToken.sub;
        await existingUser.save();
        user = existingUser;
      } else {
        console.log('Creating new user with Google account:', email);
        user = await userModel.create({
          googleId: verifiedToken.sub,
          email,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || '',
          role: 'user',
        });
      }
    } else {
      console.log('User found with email:', email);
    }

    // Generate JWT token
    const token = jwt.sign({
      id: user._id,
      name: user.firstName + ' ' + user.lastName,
      email: user.email,
      role: user.role,
    }, JWT_SECRET);

    console.log('Token generated for Google user:', token);
    res.redirect(`http://localhost:5173/dashboard?token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error.message, error);
    res.redirect('http://localhost:5173/login?error=auth_failed');
  }
});

// ✅ Get Current User with Logging
userRouter.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Get current user request - /me, token:', token);
  if (!token) {
    console.log('No token provided in /me request');
    return res.status(401).json({ msg: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded:', decoded);
    const user = await userModel.findById(decoded.id);
    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({
      id: user._id,
      name: user.firstName + ' ' + user.lastName,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Error in /me route:', error.message, error);
    res.status(401).json({ msg: 'Invalid token' });
  }
});

module.exports = { userRouter };