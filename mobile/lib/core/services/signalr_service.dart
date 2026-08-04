import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:signalr_netcore/signalr_client.dart';
import '../../domain/entities/vehicle_telemetry.dart';

enum SignalRConnectionState {
  disconnected,
  connecting,
  connected,
  reconnecting,
}

class SignalRService {
  HubConnection? _hubConnection;
  final _telemetryController = StreamController<VehicleTelemetry>.broadcast();
  final _connectionStateController = StreamController<SignalRConnectionState>.broadcast();
  final _depositSuccessController = StreamController<String>.broadcast();
  SignalRConnectionState _currentState = SignalRConnectionState.disconnected;

  Stream<VehicleTelemetry> get telemetryStream => _telemetryController.stream;
  Stream<SignalRConnectionState> get connectionStateStream => _connectionStateController.stream;
  Stream<String> get depositSuccessStream => _depositSuccessController.stream;
  SignalRConnectionState get currentState => _currentState;

  // Determine Hub URL based on the platform for local development
  String get _defaultHubUrl {
    if (kIsWeb) {
      return 'http://localhost:5022/hub/notifications';
    }
    // Android emulator needs 10.0.2.2 to access host's localhost
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5022/hub/notifications';
      }
    } catch (_) {
      // Platform check can throw on web
    }
    return 'http://localhost:5022/hub/notifications';
  }

  Future<void> initConnection({String? customHubUrl}) async {
    final hubUrl = customHubUrl ?? _defaultHubUrl;
    
    if (_hubConnection != null) {
      await disconnect();
    }

    _updateState(SignalRConnectionState.connecting);

    // Build the connection with automatic reconnect capabilities
    _hubConnection = HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .build();

    // Listen to hub lifecycle events
    _hubConnection!.onclose(({error}) {
      debugPrint('SignalR: Connection closed. Error: $error');
      _updateState(SignalRConnectionState.disconnected);
    });

    _hubConnection!.onreconnecting(({error}) {
      debugPrint('SignalR: Reconnecting... Error: $error');
      _updateState(SignalRConnectionState.reconnecting);
    });

    _hubConnection!.onreconnected(({connectionId}) {
      debugPrint('SignalR: Reconnected successfully with ID: $connectionId');
      _updateState(SignalRConnectionState.connected);
    });

    // Register listener for "ReceiveVehicleTelemetry" pushed from backend
    _hubConnection!.on('ReceiveVehicleTelemetry', (arguments) {
      if (arguments != null && arguments.isNotEmpty) {
        try {
          final data = arguments.first as Map<String, dynamic>;
          final telemetry = VehicleTelemetry.fromJson(data);
          _telemetryController.add(telemetry);
        } catch (e) {
          debugPrint('SignalR: Error parsing telemetry data: $e');
        }
      }
    });

    // Register listener for "ReceiveNotification" pushed from backend
    _hubConnection!.on('ReceiveNotification', (arguments) {
      if (arguments != null && arguments.isNotEmpty) {
        try {
          final message = arguments.first as String;
          debugPrint('SignalR: Received personal notification: $message');
          // Parse order ID from message: "Đặt cọc thành công, mã đơn hàng của bạn là <OrderId>"
          final regExp = RegExp(r'([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})');
          final match = regExp.firstMatch(message);
          if (match != null) {
            final orderId = match.group(0);
            if (orderId != null) {
              _depositSuccessController.add(orderId);
            }
          }
        } catch (e) {
          debugPrint('SignalR: Error parsing notification data: $e');
        }
      }
    });

    // Start connection
    try {
      await _hubConnection!.start();
      debugPrint('SignalR: Connected to hub at $hubUrl');
      _updateState(SignalRConnectionState.connected);
    } catch (e) {
      debugPrint('SignalR: Error starting connection to $hubUrl: $e');
      _updateState(SignalRConnectionState.disconnected);
    }
  }

  Future<void> registerCustomer(String customerId) async {
    if (_hubConnection != null && _currentState == SignalRConnectionState.connected) {
      try {
        await _hubConnection!.invoke('RegisterCustomer', args: [customerId]);
        debugPrint('SignalR: Registered customer $customerId successfully');
      } catch (e) {
        debugPrint('SignalR: Error invoking RegisterCustomer: $e');
      }
    } else {
      debugPrint('SignalR: Cannot register customer, connection not ready');
    }
  }

  Future<void> disconnect() async {
    if (_hubConnection != null) {
      try {
        await _hubConnection!.stop();
      } catch (e) {
        debugPrint('SignalR: Error stopping connection: $e');
      } finally {
        _hubConnection = null;
        _updateState(SignalRConnectionState.disconnected);
      }
    }
  }

  void _updateState(SignalRConnectionState state) {
    _currentState = state;
    _connectionStateController.add(state);
  }

  void dispose() {
    disconnect();
    _telemetryController.close();
    _connectionStateController.close();
    _depositSuccessController.close();
  }
}
