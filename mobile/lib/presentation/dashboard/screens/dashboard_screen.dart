import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/di/injection.dart';
import '../../../core/services/signalr_service.dart';
import '../../../domain/entities/vehicle_telemetry.dart';
import '../widgets/battery_widget.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with SingleTickerProviderStateMixin {
  final SignalRService _signalRService = locator<SignalRService>();
  final MapController _mapController = MapController();
  
  StreamSubscription<VehicleTelemetry>? _telemetrySubscription;
  StreamSubscription<SignalRConnectionState>? _stateSubscription;

  VehicleTelemetry? _latestTelemetry;
  SignalRConnectionState _connectionState = SignalRConnectionState.disconnected;
  
  // Default coordinates (Landmark 81, HCMC)
  final LatLng _defaultLocation = const LatLng(10.795400, 106.721900);
  bool _isAutoCenterEnabled = true;

  // Animation controller for pulsing radar around vehicle pin
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _connectionState = _signalRService.currentState;

    // Pulse animation setup
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    // Subscribe to SignalR connection state changes
    _stateSubscription = _signalRService.connectionStateStream.listen((state) {
      if (mounted) {
        setState(() {
          _connectionState = state;
        });
      }
    });

    // Subscribe to live telemetry packets
    _telemetrySubscription = _signalRService.telemetryStream.listen((telemetry) {
      if (mounted) {
        setState(() {
          _latestTelemetry = telemetry;
        });

        // Pan map automatically if auto-center is turned on
        if (_isAutoCenterEnabled) {
          _mapController.move(
            LatLng(telemetry.latitude, telemetry.longitude),
            _mapController.camera.zoom,
          );
        }
      }
    });

    // Initialize/start connection to the backend hub
    _signalRService.initConnection();
  }

  @override
  void dispose() {
    _telemetrySubscription?.cancel();
    _stateSubscription?.cancel();
    _pulseController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  // Get status color for connection
  Color _getConnectionColor(SignalRConnectionState state) {
    switch (state) {
      case SignalRConnectionState.connected:
        return const Color(0xFF10B981); // Green
      case SignalRConnectionState.connecting:
      case SignalRConnectionState.reconnecting:
        return const Color(0xFFF59E0B); // Orange
      case SignalRConnectionState.disconnected:
        return const Color(0xFFEF4444); // Red
    }
  }

  // Get status text for connection
  String _getConnectionText(SignalRConnectionState state) {
    switch (state) {
      case SignalRConnectionState.connected:
        return 'Liên kết IoT: Trực tuyến';
      case SignalRConnectionState.connecting:
        return 'Đang kết nối thiết bị...';
      case SignalRConnectionState.reconnecting:
        return 'Đang tái thiết lập liên kết...';
      case SignalRConnectionState.disconnected:
        return 'Mất kết nối thiết bị';
    }
  }

  @override
  Widget build(BuildContext context) {
    final vehicleLoc = _latestTelemetry != null
        ? LatLng(_latestTelemetry!.latitude, _latestTelemetry!.longitude)
        : _defaultLocation;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Premium Slate Black
      body: Stack(
        children: [
          // 1. Dynamic Map Layer
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: vehicleLoc,
              initialZoom: 16.0,
              maxZoom: 18.0,
              minZoom: 10.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.vinfast.o2o.mobile',
              ),
              MarkerLayer(
                markers: [
                  // Live vehicle marker with pulsing radar animation
                  Marker(
                    point: vehicleLoc,
                    width: 70,
                    height: 70,
                    child: AnimatedBuilder(
                      animation: _pulseController,
                      builder: (context, child) {
                        return Stack(
                          alignment: Alignment.center,
                          children: [
                            // Pulse Ring 1
                            Container(
                              width: 32 + (30 * _pulseController.value),
                              height: 32 + (30 * _pulseController.value),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: const Color(0xFF3B82F6).withOpacity(
                                  (1.0 - _pulseController.value).clamp(0.0, 1.0),
                                ),
                              ),
                            ),
                            // Pulse Ring 2
                            Container(
                              width: 15 + (45 * _pulseController.value),
                              height: 15 + (45 * _pulseController.value),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: const Color(0xFF60A5FA).withOpacity(
                                  ((1.0 - _pulseController.value) * 0.5).clamp(0.0, 1.0),
                                ),
                              ),
                            ),
                            // Center Icon Button Casing
                            Container(
                              width: 34,
                              height: 34,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(0xFF0F172A),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black45,
                                    blurRadius: 6,
                                    offset: Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.electric_car,
                                color: Color(0xFF3B82F6),
                                size: 20,
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),

          // 2. Custom Glassmorphic Overlay Header & HUD Controls
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            right: 16,
            child: Column(
              children: [
                // Top control bar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Back button with glass card
                    InkWell(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A).withOpacity(0.85),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white10),
                          boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8)],
                        ),
                        child: const Icon(Icons.arrow_back, color: Colors.white),
                      ),
                    ),

                    // Connection HUD
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A).withOpacity(0.85),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white10),
                        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8)],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _getConnectionColor(_connectionState),
                              boxShadow: [
                                BoxShadow(
                                  color: _getConnectionColor(_connectionState).withOpacity(0.6),
                                  blurRadius: 6,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _getConnectionText(_connectionState),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Manual connect controls when disconnected
                if (_connectionState == SignalRConnectionState.disconnected)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444).withOpacity(0.9),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8)],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Mất tín hiệu kết nối đến server.',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        ElevatedButton.icon(
                          onPressed: () => _signalRService.initConnection(),
                          icon: const Icon(Icons.refresh, size: 16, color: Color(0xFFEF4444)),
                          label: const Text(
                            'Kết nối lại',
                            style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          // 3. Floating Action buttons
          Positioned(
            right: 16,
            bottom: 250, // Floating above the bottom overlay card
            child: Column(
              children: [
                // Toggle Map centering
                FloatingActionButton(
                  heroTag: 'center_toggle',
                  onPressed: () {
                    setState(() {
                      _isAutoCenterEnabled = !_isAutoCenterEnabled;
                    });
                    if (_isAutoCenterEnabled && _latestTelemetry != null) {
                      _mapController.move(
                        LatLng(_latestTelemetry!.latitude, _latestTelemetry!.longitude),
                        _mapController.camera.zoom,
                      );
                    }
                  },
                  backgroundColor: _isAutoCenterEnabled ? const Color(0xFF3B82F6) : const Color(0xFF1E293B),
                  foregroundColor: Colors.white,
                  child: Icon(_isAutoCenterEnabled ? Icons.gps_fixed : Icons.gps_not_fixed),
                ),
                const SizedBox(height: 10),
                
                // Recenter map button
                FloatingActionButton(
                  heroTag: 'recenter_btn',
                  onPressed: () {
                    _mapController.move(vehicleLoc, 16.0);
                  },
                  backgroundColor: const Color(0xFF1E293B),
                  foregroundColor: Colors.white,
                  child: const Icon(Icons.my_location),
                ),
              ],
            ),
          ),

          // 4. Telemetry Glassmorphic Bottom Panel
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A).withOpacity(0.93),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(28),
                  topRight: Radius.circular(28),
                ),
                border: Border.all(color: Colors.white10),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black80,
                    blurRadius: 24,
                    offset: Offset(0, -6),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header detailing vehicle identifier
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'GIÁM SÁT IoT PHƯƠNG TIỆN',
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _latestTelemetry?.vin ?? 'VF8-MOCK-9999',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      
                      // Telemetry Status
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _latestTelemetry != null
                              ? const Color(0xFF1E3A8A).withOpacity(0.5)
                              : const Color(0xFF334155).withOpacity(0.5),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: _latestTelemetry != null
                                ? const Color(0xFF3B82F6)
                                : Colors.grey,
                          ),
                        ),
                        child: Text(
                          _latestTelemetry != null ? 'NHẬN DỮ LIỆU LIVE' : 'CHỜ TÍN HIỆU',
                          style: TextStyle(
                            color: _latestTelemetry != null
                                ? const Color(0xFF93C5FD)
                                : Colors.grey[400],
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Content Panel split: Battery display left, stats right
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Animated Battery Widget
                      Column(
                        children: [
                          BatteryWidget(
                            percentage: _latestTelemetry?.batteryPercentage ?? 0.0,
                            isCharging: _latestTelemetry?.isCharging ?? false,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _latestTelemetry?.isCharging == true 
                                ? '⚡ Trạng thái: Đang nạp điện' 
                                : '🔋 Trạng thái: Đang xả điện',
                            style: TextStyle(
                              color: _latestTelemetry?.isCharging == true 
                                  ? const Color(0xFF38BDF8)
                                  : const Color(0xFF94A3B8),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 16),

                      // Metrics Column (Speed, Temperature)
                      Expanded(
                        child: Column(
                          children: [
                            // Speed Display
                            _buildTelemetryRow(
                              icon: Icons.speed,
                              label: 'Vận tốc',
                              value: '${_latestTelemetry?.speed.toStringAsFixed(1) ?? '0.0'} km/h',
                              valueColor: const Color(0xFFF1F5F9),
                            ),
                            const SizedBox(height: 8),
                            
                            // Temperature Display
                            _buildTelemetryRow(
                              icon: Icons.thermostat,
                              label: 'Nhiệt độ Pin',
                              value: '${_latestTelemetry?.batteryTemperature.toStringAsFixed(1) ?? '0.0'} °C',
                              valueColor: (_latestTelemetry?.batteryTemperature ?? 0) > 40.0
                                  ? const Color(0xFFEF4444)
                                  : const Color(0xFFF1F5F9),
                            ),
                            const SizedBox(height: 8),

                            // Update Time
                            _buildTelemetryRow(
                              icon: Icons.access_time,
                              label: 'Cập nhật cuối',
                              value: _latestTelemetry != null
                                  ? '${_latestTelemetry!.timestamp.hour.toString().padLeft(2, '0')}:${_latestTelemetry!.timestamp.minute.toString().padLeft(2, '0')}:${_latestTelemetry!.timestamp.second.toString().padLeft(2, '0')}'
                                  : '--:--:--',
                              valueColor: const Color(0xFF94A3B8),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Helper widget to build metric details rows
  Widget _buildTelemetryRow({
    required IconData icon,
    required String label,
    required String value,
    required Color valueColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withOpacity(0.4),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withOpacity(0.04)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF64748B)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: valueColor,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
