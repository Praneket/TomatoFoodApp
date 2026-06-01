require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || process.env.USER_SERVICE_PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
  userId:       { type: String, required: true, unique: true, index: true },
  name:         String,
  email:        String,
  phone:        String,
  avatar:       String,
  dateOfBirth:  Date,
  gender:       { type: String, enum: ['male', 'female', 'other'] },
  preferences:  { cuisine: [String], dietary: [String], spiceLevel: String },
  addresses: [{
    label:    { type: String, default: 'Home' },
    line1:    String,
    line2:    String,
    city:     String,
    state:    String,
    pincode:  String,
    lat:      Number,
    lng:      Number,
    isDefault: { type: Boolean, default: false },
  }],
  favorites:    [{ restaurantId: String, addedAt: { type: Date, default: Date.now } }],
  loyaltyPoints: { type: Number, default: 0 },
  referralCode:  String,
  savedPayments: [{
    type:     String,
    last4:    String,
    brand:    String,
    expiry:   String,
    isDefault: Boolean,
  }],
}, { timestamps: true });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  try { req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET); next(); }
  catch { res.status(401).json({ success: false, error: { message: 'Invalid token' } }); }
};
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/users/profile
app.get('/api/users/profile', auth, wrap(async (req, res) => {
  let profile = await UserProfile.findOne({ userId: req.user.id });
  if (!profile) profile = await UserProfile.create({ userId: req.user.id, name: req.user.name, email: req.user.email });
  res.json({ success: true, data: { user: profile } });
}));

// PUT /api/users/profile
app.put('/api/users/profile', auth, wrap(async (req, res) => {
  const { name, phone, avatar, dateOfBirth, gender, preferences } = req.body;
  const profile = await UserProfile.findOneAndUpdate(
    { userId: req.user.id },
    { $set: { name, phone, avatar, dateOfBirth, gender, preferences } },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: { user: profile } });
}));

// GET /api/users/addresses
app.get('/api/users/addresses', auth, wrap(async (req, res) => {
  const profile = await UserProfile.findOne({ userId: req.user.id });
  res.json({ success: true, data: { addresses: profile?.addresses || [] } });
}));

// POST /api/users/addresses
app.post('/api/users/addresses', auth, wrap(async (req, res) => {
  const profile = await UserProfile.findOneAndUpdate(
    { userId: req.user.id },
    { $push: { addresses: req.body } },
    { new: true, upsert: true }
  );
  res.status(201).json({ success: true, data: { addresses: profile.addresses } });
}));

// DELETE /api/users/addresses/:addressId
app.delete('/api/users/addresses/:addressId', auth, wrap(async (req, res) => {
  const profile = await UserProfile.findOneAndUpdate(
    { userId: req.user.id },
    { $pull: { addresses: { _id: req.params.addressId } } },
    { new: true }
  );
  res.json({ success: true, data: { addresses: profile?.addresses || [] } });
}));

// POST /api/users/favorites
app.post('/api/users/favorites', auth, wrap(async (req, res) => {
  const { restaurantId } = req.body;
  const profile = await UserProfile.findOne({ userId: req.user.id });
  const isFav = profile?.favorites?.some((f) => f.restaurantId === restaurantId);

  if (isFav) {
    await UserProfile.findOneAndUpdate({ userId: req.user.id }, { $pull: { favorites: { restaurantId } } });
    return res.json({ success: true, message: 'Removed from favorites', data: { isFavorite: false } });
  }

  await UserProfile.findOneAndUpdate(
    { userId: req.user.id },
    { $push: { favorites: { restaurantId } } },
    { upsert: true }
  );
  res.json({ success: true, message: 'Added to favorites', data: { isFavorite: true } });
}));

// GET /api/users/favorites
app.get('/api/users/favorites', auth, wrap(async (req, res) => {
  const profile = await UserProfile.findOne({ userId: req.user.id });
  res.json({ success: true, data: { favorites: profile?.favorites || [] } });
}));

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'user-service' }));
app.use((err, req, res, next) => res.status(500).json({ success: false, error: { message: err.message } }));

app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tomato_users')
  .then(() => console.log('MongoDB connected (user-service)'))
  .catch((err) => console.error('MongoDB connection failed:', err.message));

module.exports = app;
