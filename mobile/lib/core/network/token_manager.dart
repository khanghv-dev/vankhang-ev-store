class TokenManager {
  String? _token;

  TokenManager() {
    // Inject a default mock JWT token for testing
    _token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlBoYW4gVmFuIEtoYW5nIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  }

  // Get current token
  String? get token => _token;

  // Set / Save token
  void saveToken(String token) {
    _token = token;
  }

  // Clear token (Log out)
  void clearToken() {
    _token = null;
  }

  // Check if token exists
  bool get hasToken => _token != null && _token!.isNotEmpty;
}
