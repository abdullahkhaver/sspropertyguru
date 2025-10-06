// src/middleware/notFoundHandler.js
import { ApiError } from '../utils/ApiError.js';

export const notFoundHandler = (req, res, next) => {
  // Any request that doesn’t match routes will end up here
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};
