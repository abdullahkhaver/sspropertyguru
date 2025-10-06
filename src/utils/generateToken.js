// src/utils/generateToken.js
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  try {
    const payload = { id: user._id, email: user.email, role: user.role };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return token; // just return token string
  } catch (err) {
    console.error('Error generating token:', err.message);
    throw new Error('Token generation failed');
  }
};

export default generateToken;
