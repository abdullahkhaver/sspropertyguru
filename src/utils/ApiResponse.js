// src/utils/ApiResponse.js

export class ApiResponse {
  constructor(statusCode, data = null, message = "Success") {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  // NOTE: Controllers call this as ApiResponse.success('message', data)
  // Website frontend reads response.data (the full object) or response.data.data
  // DO NOT change argument order - website depends on current behavior
  static success(data, message = "Request successful", statusCode = 200) {
    return new ApiResponse(statusCode, data, message);
  }

  static created(data, message = "Resource created successfully") {
    return new ApiResponse(201, data, message);
  }
}
