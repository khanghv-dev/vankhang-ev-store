import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'token_manager.dart';

class JwtInterceptor extends Interceptor {
  final TokenManager _tokenManager;

  JwtInterceptor(this._tokenManager);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Inject Authorization Header dynamically if token is present
    if (_tokenManager.hasToken) {
      options.headers['Authorization'] = 'Bearer ${_tokenManager.token}';
    }
    
    super.onRequest(options, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Catch token authorization expiry response codes
    if (err.response?.statusCode == 401) {
      // Typically trigger a refresh-token loop or log out action
      debugPrint("JWT Token expired or invalid: Unauthorized (401)");
    }
    
    super.onError(err, handler);
  }
}
