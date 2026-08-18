const crypto = require('crypto');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Progress = require('../models/Progress');
const Recommendation = require('../models/Recommendation');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { success, error } = require('../utils/apiResponse');

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return error(res, 409, 'Email already registered');
  }

  const user = await User.create({ name, email: normalizedEmail, password, role: 'user' });

  return success(res, 201, 'Registration successful', {
    user: publicUser(user),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +tokenVersion');
  if (!user || !(await user.matchPassword(password))) {
    return error(res, 401, 'Invalid email or password');
  }

  const token = generateToken(user);

  return success(res, 200, 'Login successful', {
    token,
    user: publicUser(user),
  });
});

const getMe = asyncHandler(async (req, res) => {
  return success(res, 200, 'User fetched', { user: publicUser(req.user) });
});

const updateAccount = asyncHandler(async (req, res) => {
  const { name, email, currentPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +tokenVersion');

  if (!user) return error(res, 404, 'User not found');

  const nextName = name !== undefined ? name.trim() : user.name;
  const nextEmail = email !== undefined ? email.trim().toLowerCase() : user.email;
  const nameChanged = nextName !== user.name;
  const emailChanged = nextEmail !== user.email;

  if (!nameChanged && !emailChanged) {
    return success(res, 200, 'No account changes were detected', { user: publicUser(user) });
  }

  if (!currentPassword) {
    return error(res, 400, 'Current password is required to update account information');
  }

  const passwordMatches = await user.matchPassword(currentPassword);
  if (!passwordMatches) {
    return error(res, 401, 'Current password is incorrect');
  }

  if (emailChanged) {
    const existing = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
    if (existing) return error(res, 409, 'Email already registered');
  }

  user.name = nextName;
  user.email = nextEmail;
  await user.save();

  return success(res, 200, 'Account updated', { user: publicUser(user) });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +tokenVersion');

  if (!user) return error(res, 404, 'User not found');

  const passwordMatches = await user.matchPassword(currentPassword);
  if (!passwordMatches) {
    return error(res, 401, 'Current password is incorrect');
  }

  user.password = newPassword;
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return success(res, 200, 'Password changed. Please log in again.', {});
});

const forgotPassword = asyncHandler(async (req, res) => {
  const genericMessage = 'If an account exists for this email, a password reset link has been sent.';
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select(
    '+passwordResetToken +passwordResetExpires'
  );

  if (!user) {
    return success(res, 200, genericMessage, {});
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 20 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (mailError) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw mailError;
  }

  return success(res, 200, genericMessage, {});
});

const resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires +tokenVersion');

  if (!user) {
    return error(res, 400, 'Password reset link is invalid or has expired');
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  await user.save();

  return success(res, 200, 'Password reset successful. Please log in.', {});
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
  return success(res, 200, 'Logout successful', {});
});

const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) return error(res, 404, 'User not found');

  if (user.role === 'admin') {
    return error(res, 400, 'Admin accounts cannot be deleted from the user settings page');
  }

  const passwordMatches = await user.matchPassword(req.body.currentPassword);
  if (!passwordMatches) {
    return error(res, 401, 'Current password is incorrect');
  }

  await Promise.all([
    Profile.deleteOne({ userId: user._id }),
    Progress.deleteMany({ userId: user._id }),
    Recommendation.deleteMany({ userId: user._id }),
  ]);
  await user.deleteOne();

  return success(res, 200, 'Account deleted', {});
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateAccount,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser,
  deleteAccount,
};
