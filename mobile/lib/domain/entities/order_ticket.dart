class OrderTicket {
  final String orderId;
  final String vehicleName;
  final String vin;
  final String showroomName;
  final String showroomAddress;
  final double depositAmount;
  final DateTime paidAt;

  const OrderTicket({
    required this.orderId,
    required this.vehicleName,
    required this.vin,
    required this.showroomName,
    required this.showroomAddress,
    required this.depositAmount,
    required this.paidAt,
  });

  OrderTicket copyWith({
    String? orderId,
    String? vehicleName,
    String? vin,
    String? showroomName,
    String? showroomAddress,
    double? depositAmount,
    DateTime? paidAt,
  }) {
    return OrderTicket(
      orderId: orderId ?? this.orderId,
      vehicleName: vehicleName ?? this.vehicleName,
      vin: vin ?? this.vin,
      showroomName: showroomName ?? this.showroomName,
      showroomAddress: showroomAddress ?? this.showroomAddress,
      depositAmount: depositAmount ?? this.depositAmount,
      paidAt: paidAt ?? this.paidAt,
    );
  }
}
