const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const Otp = require('../models/Otp');
const Event = require('../models/Event');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { toJSON } = require('../utils/serialize');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
      role: user.role,
      user_metadata: { name: user.name, role: user.role },
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

async function ensureMerchantProfile(user) {
  if (user && user.role === 'MERCHANT') {
    const existing = await Merchant.findOne({ user_id: user._id });
    if (!existing) {
      await Merchant.create({
        user_id: user._id,
        business_name: `${user.name}'s Store`,
      });
    }
  }
}

// POST /api/v1/auth/register — Direct register (local auth)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Name, email, and password are required' } });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(409).json({ success: false, error: { code: 'USER_EXISTS', message: 'User with this email already exists' } });
    }

    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const userRole = (role || 'CUSTOMER').toUpperCase();

    user = await User.create({
      _id: userId,
      name,
      email: normalizedEmail,
      password_hash: hashPassword(password),
      role: userRole,
    });

    await ensureMerchantProfile(user);

    const token = generateToken(user);
    res.json({ success: true, token, data: toJSON(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: { code: 'REGISTER_ERROR', message: err.message } });
  }
});

// POST /api/v1/auth/login — Direct login (local auth)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email and password are required' } });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    if (user.password_hash && user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    await ensureMerchantProfile(user);

    const token = generateToken(user);
    res.json({ success: true, token, data: toJSON(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: { code: 'LOGIN_ERROR', message: err.message } });
  }
});

// POST /api/v1/auth/sync — Sync Supabase Auth user to DB
router.post('/sync', authenticate, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const email = (req.user.email || '').toLowerCase().trim();
    const userMetadata = req.user.user_metadata || {};
    const name = userMetadata.name || (email ? email.split('@')[0] : 'User');
    const role = (req.user.role || userMetadata.role || 'CUSTOMER').toUpperCase();

    let user = await User.findById(userId);
    if (!user && email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      user = await User.create({ _id: userId, name, email, role });
    } else if (user && user.role !== role && userMetadata.role) {
      user.role = role;
      await user.save();
    }

    await ensureMerchantProfile(user);

    res.json({ success: true, data: toJSON(user) });
  } catch (err) {
    console.error('Auth sync error:', err);
    res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: err.message } });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    let user = await User.findById(userId);

    if (!user) {
      const email = (req.user.email || '').toLowerCase().trim();
      const userMetadata = req.user.user_metadata || {};
      const name = userMetadata.name || (email ? email.split('@')[0] : 'User');
      const role = (req.user.role || userMetadata.role || 'CUSTOMER').toUpperCase();
      user = await User.create({ _id: userId, name, email, role });
    }

    await ensureMerchantProfile(user);

    res.json({ success: true, data: toJSON(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'AUTH_ERROR', message: err.message } });
  }
});

// PUT /api/v1/auth/me
router.put('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const { name, phone, avatar_url } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    res.json({ success: true, data: toJSON(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: err.message } });
  }
});

// POST /api/v1/auth/otp/send — Generate & dispatch 6-digit OTP for Email / Mobile
router.post('/otp/send', async (req, res) => {
  try {
    const { identifier, purpose, name, role } = req.body;
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email address or 10-digit mobile number is required' },
      });
    }

    const trimmed = identifier.trim();
    let normalized = trimmed;
    const isEmail = trimmed.includes('@');

    if (isEmail) {
      normalized = trimmed.toLowerCase();
    } else {
      // Clean phone number
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length < 10) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number' },
        });
      }
      normalized = digits.slice(-10);
    }

    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate previous OTPs for this identifier
    await Otp.deleteMany({ identifier: normalized });

    // Save new OTP with 10-minute expiry
    await Otp.create({
      identifier: normalized,
      otp: otpCode,
      purpose: purpose || 'login',
      name: name || null,
      role: (role || 'CUSTOMER').toUpperCase(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    console.log(`[AUTH OTP] Code for ${normalized} is: ${otpCode}`);

    res.json({
      success: true,
      message: `OTP sent successfully to ${isEmail ? normalized : '+91 ' + normalized}`,
      otp: otpCode, // Provided for smooth local testing and demo auto-fill
      identifier: normalized,
      isEmail,
    });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ success: false, error: { code: 'OTP_SEND_ERROR', message: err.message } });
  }
});

// POST /api/v1/auth/otp/verify — Verify OTP & issue session token (auto-onboards if new)
router.post('/otp/verify', async (req, res) => {
  try {
    const { identifier, otp, purpose, name, role } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Identifier and OTP code are required' },
      });
    }

    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');
    const normalized = isEmail ? trimmed.toLowerCase() : trimmed.replace(/\D/g, '').slice(-10);
    const cleanedOtp = otp.toString().trim();

    // Verify OTP record
    const otpRecord = await Otp.findOne({
      identifier: normalized,
      otp: cleanedOtp,
      verified: false,
      expires_at: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP. Please enter the correct 6-digit code.' },
      });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Find or Auto-Create User
    let user = null;
    if (isEmail) {
      user = await User.findOne({ email: normalized });
    } else {
      user = await User.findOne({
        $or: [{ phone: normalized }, { email: `${normalized}@localmart.internal` }],
      });
    }

    if (!user) {
      const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const userRole = (role || otpRecord.role || 'CUSTOMER').toUpperCase();
      const userName = name || otpRecord.name || (isEmail ? normalized.split('@')[0] : `Shopper ${normalized.slice(-4)}`);

      user = await User.create({
        _id: userId,
        name: userName,
        email: isEmail ? normalized : `${normalized}@localmart.internal`,
        phone: !isEmail ? normalized : null,
        role: userRole,
      });
    } else {
      if (!user.phone && !isEmail) {
        user.phone = normalized;
        await user.save();
      }
    }

    await ensureMerchantProfile(user);

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      data: toJSON(user),
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ success: false, error: { code: 'OTP_VERIFY_ERROR', message: err.message } });
  }
});

// POST /api/v1/auth/feedback — Record user logout feedback
router.post('/feedback', async (req, res) => {
  try {
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        userId = decoded.sub || decoded.id;
      } catch {}
    }

    const { rating, tags, comment, user_name } = req.body;

    const event = await Event.create({
      event_type: 'USER_LOGOUT_FEEDBACK',
      user_id: userId,
      metadata_json: {
        rating: typeof rating === 'number' ? rating : 5,
        tags: Array.isArray(tags) ? tags : [],
        comment: comment || '',
        user_name: user_name || 'Guest User',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      message: 'Thank you! Your feedback helps us improve your neighborhood shopping experience.',
      data: event,
    });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ success: false, error: { code: 'FEEDBACK_ERROR', message: err.message } });
  }
});

module.exports = router;

