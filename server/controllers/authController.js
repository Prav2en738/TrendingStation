import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { HttpError, wrap } from '../utils/http.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  role: user.role,
  createdAt: user.createdAt
});

const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = wrap(async (req, res) => {
  const { name, email, phone, password, address } = req.body;

  if (![name, email, phone, password].every(isText)) {
    throw new HttpError(400, 'All fields are required: name, email, phone, password');
  }
  if (!EMAIL.test(email.trim())) throw new HttpError(400, 'Please enter a valid email address');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');

  if (await User.findOne({ email: email.trim() })) {
    throw new HttpError(400, 'Email already registered');
  }

  // role is NEVER taken from the request: public sign-ups are always customers
  const user = await User.create({
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    address: isText(address) ? address.trim() : '',
    password,
    role: 'CUSTOMER'
  });

  res.status(201).json({
    success: true,
    data: { user: publicUser(user), token: generateToken(user._id) },
    message: 'User registered successfully'
  });
});

export const login = wrap(async (req, res) => {
  const { email, password } = req.body;

  // typeof checks also stop object-style injection like { "$ne": "" }
  if (!isText(email) || !isText(password)) {
    throw new HttpError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  res.json({
    success: true,
    data: { user: publicUser(user), token: generateToken(user._id) },
    message: 'Login successful'
  });
});

export const getMe = wrap(async (req, res) => {
  res.json({ success: true, data: { user: publicUser(req.user) } });
});

// Customers keep their delivery details on their profile
export const updateMe = wrap(async (req, res) => {
  const { name, phone, address } = req.body;
  if (name !== undefined) {
    if (!isText(name)) throw new HttpError(400, 'Name cannot be empty');
    req.user.name = name.trim();
  }
  if (phone !== undefined) {
    if (!isText(phone)) throw new HttpError(400, 'Phone cannot be empty');
    req.user.phone = phone.trim();
  }
  if (address !== undefined) req.user.address = String(address).trim();
  await req.user.save();
  res.json({ success: true, data: { user: publicUser(req.user) }, message: 'Profile updated' });
});
