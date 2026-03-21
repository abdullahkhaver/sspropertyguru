// src/utils/ApiResponse.js

export class ApiResponse {
  constructor(statusCode, data = null, message = "Success") {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success(data, message = "Request successful", statusCode = 200) {
    return new ApiResponse(statusCode, data, message);
  }

  static created(data, message = "Resource created successfully") {
    return new ApiResponse(201, data, message);
  }
}
