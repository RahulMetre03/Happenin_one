import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'organizer', 'user'],
      default: 'user',
    },
    otp: {
    code: String,
    expiresAt: Date
  }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
