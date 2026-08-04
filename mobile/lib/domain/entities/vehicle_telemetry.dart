class VehicleTelemetry {
  final String vin;
  final double latitude;
  final double longitude;
  final double batteryPercentage;
  final bool isCharging;
  final double speed;
  final double batteryTemperature;
  final DateTime timestamp;

  const VehicleTelemetry({
    required this.vin,
    required this.latitude,
    required this.longitude,
    required this.batteryPercentage,
    required this.isCharging,
    required this.speed,
    required this.batteryTemperature,
    required this.timestamp,
  });

  factory VehicleTelemetry.fromJson(Map<String, dynamic> json) {
    return VehicleTelemetry(
      vin: json['vin'] as String? ?? 'UNKNOWN',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      batteryPercentage: (json['batteryPercentage'] as num?)?.toDouble() ?? 0.0,
      isCharging: json['isCharging'] as bool? ?? false,
      speed: (json['speed'] as num?)?.toDouble() ?? 0.0,
      batteryTemperature: (json['batteryTemperature'] as num?)?.toDouble() ?? 0.0,
      timestamp: json['timestampUnix'] != null
          ? DateTime.fromMillisecondsSinceEpoch((json['timestampUnix'] as int) * 1000)
          : DateTime.now(),
    );
  }

  VehicleTelemetry copyWith({
    String? vin,
    double? latitude,
    double? longitude,
    double? batteryPercentage,
    bool? isCharging,
    double? speed,
    double? batteryTemperature,
    DateTime? timestamp,
  }) {
    return VehicleTelemetry(
      vin: vin ?? this.vin,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      batteryPercentage: batteryPercentage ?? this.batteryPercentage,
      isCharging: isCharging ?? this.isCharging,
      speed: speed ?? this.speed,
      batteryTemperature: batteryTemperature ?? this.batteryTemperature,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}
