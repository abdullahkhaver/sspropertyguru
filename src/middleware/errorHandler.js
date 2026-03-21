import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  // console.error('Error:', err);
  console.error('SERVER ERROR STACK:', err.stack || err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details || null,
      timestamp: err.timestamp,
    });
  }

  // fallback for unhandled errors
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message || 'Unknown error', // provide message for debugging
    timestamp: new Date().toISOString(),
  });
};
