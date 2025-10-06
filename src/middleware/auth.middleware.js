
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new ApiError(401, 'Not authorized, token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return next(new ApiError(404, 'User not found'));
    }

    next();
  } catch (error) {
    return next(new ApiError(401, 'Not authorized, token failed'));
  }
};

export default protect;
