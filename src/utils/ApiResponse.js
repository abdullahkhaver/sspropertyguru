// src/utils/ApiResponse.js

export class ApiResponse {
  constructor(statusCode, data = null, message = "Success") {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
    // Alias fields for backward compatibility with any frontend that reads differently
    this.results = data;
    this.timestamp = new Date().toISOString();
  }

  // Called as: ApiResponse.success('message string', actualData)
  // All controllers use this pattern
  static success(message = "Request successful", data = null, statusCode = 200) {
    return new ApiResponse(statusCode, data, message);
  }

  static created(data, message = "Resource created successfully") {
    return new ApiResponse(201, data, message);
  }
}
