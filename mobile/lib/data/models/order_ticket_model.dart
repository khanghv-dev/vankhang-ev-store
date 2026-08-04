import '../../domain/entities/order_ticket.dart';

class OrderTicketModel {
  final String orderId;
  final String vehicleName;
  final String vin;
  final String storeId;
  final double depositAmount;
  final DateTime paidAt;

  OrderTicketModel({
    required this.orderId,
    required this.vehicleName,
    required this.vin,
    required this.storeId,
    required this.depositAmount,
    required this.paidAt,
  });

  factory OrderTicketModel.fromJson(Map<String, dynamic> json) {
    final orderId = json['id'] as String? ?? '';
    
    String vehicleName = 'Xe máy điện VinFast';
    String vin = 'Chờ bàn giao';
    final items = json['items'] as List<dynamic>?;
    if (items != null && items.isNotEmpty) {
      final firstItem = items.first as Map<String, dynamic>;
      vehicleName = firstItem['productName'] as String? ?? vehicleName;
      vin = firstItem['assignedVin'] as String? ?? vin;
    }

    final storeId = json['storeId'] as String? ?? '';
    final depositAmount = (json['depositAmount'] as num?)?.toDouble() ?? 0.0;
    
    DateTime paidTime = DateTime.now();
    final paidAtStr = json['paidAt'] as String?;
    if (paidAtStr != null) {
      paidTime = DateTime.parse(paidAtStr).toLocal();
    } else {
      final createdAtStr = json['createdAt'] as String?;
      if (createdAtStr != null) {
        paidTime = DateTime.parse(createdAtStr).toLocal();
      }
    }

    return OrderTicketModel(
      orderId: orderId,
      vehicleName: vehicleName,
      vin: vin,
      storeId: storeId,
      depositAmount: depositAmount,
      paidAt: paidTime,
    );
  }

  static const Map<String, Map<String, String>> _showrooms = {
    's1111111-1111-1111-1111-111111111111': {
      'name': 'VinFast Showroom Lotte Liễu Giai',
      'address': 'Tầng B1, Lotte Center, 54 Liễu Giai, Quận Ba Đình, Hà Nội'
    },
    's2222222-2222-2222-2222-222222222222': {
      'name': 'VinFast Showroom 3S Cầu Giấy',
      'address': 'Số 8 Phạm Hùng, Phường Mai Dịch, Quận Cầu Giấy, Hà Nội'
    },
    's3333333-3333-3333-3333-333333333333': {
      'name': 'VinFast Showroom Vincom Đồng Khởi',
      'address': 'Tầng L1, Vincom Center, 72 Lê Thánh Tôn, Quận 1, TP. Hồ Chí Minh'
    },
    's4444444-4444-4444-4444-444444444444': {
      'name': 'VinFast Showroom Landmark 81',
      'address': 'Tầng L1, Vinhomes Landmark 81, 720A Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh'
    },
    's5555555-5555-5555-5555-555555555555': {
      'name': 'VinFast Showroom Ngô Quyền Da Nang',
      'address': 'Số 910A Ngô Quyền, Quận Sơn Trà, Đà Nẵng'
    },
  };

  OrderTicket toDomain() {
    final storeInfo = _showrooms[storeId.toLowerCase()] ?? {
      'name': 'VinFast Showroom Toàn Quốc',
      'address': 'Đại lý ủy quyền VinFast chính hãng Việt Nam'
    };

    return OrderTicket(
      orderId: orderId,
      vehicleName: vehicleName,
      vin: vin,
      showroomName: storeInfo['name']!,
      showroomAddress: storeInfo['address']!,
      depositAmount: depositAmount,
      paidAt: paidAt,
    );
  }
}
