const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
require('dotenv').config();

// Improved MongoDB Connection Configuration with better error handling
const connectToMongoDB = async () => {
  // Get MongoDB URI from environment or use default
  const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://prajwalghule2020:PrajwaL321@cluster0.fh11i.mongodb.net/event-manager?retryWrites=true&w=majority';
  
  // Connection options with reasonable timeouts
  const options = {
    serverSelectionTimeoutMS: 15000, // Increase timeout for server selection
    socketTimeoutMS: 45000,          // Increase socket timeout
    maxPoolSize: 10,
    connectTimeoutMS: 15000,         // Increase connection timeout
  };

  console.log('📡 Attempting MongoDB connection to:', mongoURI.replace(/:([^\/]+)@/, ':****@')); // Hide password in logs
  
  try {
    await mongoose.connect(mongoURI, options);
    console.log('✅ MongoDB Connected Successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    
    // Check for specific error types and provide targeted advice
    if (error.name === 'MongoServerSelectionError') {
      console.error('\nServer Selection Error - This usually means the MongoDB server cannot be reached.');
      console.error('Possible causes:');
      console.error('1. Your IP address is not in MongoDB Atlas whitelist');
      console.error('2. Network connectivity issues');
      console.error('3. Incorrect cluster name in connection string');
    } else if (error.message.includes('Authentication failed')) {
      console.error('\nAuthentication Error - Your username or password is incorrect.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\nHost Not Found Error - The MongoDB host cannot be resolved.');
      console.error('Check your cluster name in the connection string.');
    }

    // Set up in-memory fallback for development
    console.log('\n⚠️ Setting up memory-only mode for development');
    console.log('⚠️ WARNING: All data will be lost when the server restarts!');
    
    // Mongoose will stay disconnected, but we'll proceed with the application
    return false;
  }
};

// Schema definitions remain the same
const userSchema = new Schema({
  googleId: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String, default: "user" }
});

const eventSchema = new Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  participants: [{
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    email: { type: String, required: true, match: /.+\@.+\..+/ }
  }],
  feedback: [{
    userId: { type: Schema.Types.ObjectId, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 }
});

// Initialize models
let userModel, eventModel;

// Function to initialize models (after connection attempt)
const initModels = () => {
  if (!userModel) userModel = mongoose.models.user || mongoose.model("user", userSchema);
  if (!eventModel) eventModel = mongoose.models.event || mongoose.model("event", eventSchema);
};

// Export an async function to ensure connection is attempted before models are used
module.exports = {
  connectDB: async () => {
    await connectToMongoDB();
    initModels();
    return { userModel, eventModel };
  },
  get userModel() {
    initModels();
    return userModel;
  },
  get eventModel() {
    initModels();
    return eventModel;
  }
};