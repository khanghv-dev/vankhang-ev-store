import '../../core/network/dio_client.dart';
import '../../domain/entities/order_ticket.dart';
import '../../domain/repositories/order_repository.dart';
import '../models/order_ticket_model.dart';

class OrderRepositoryImpl implements OrderRepository {
  final DioClient _dioClient;

  OrderRepositoryImpl(this._dioClient);

  @override
  Future<OrderTicket> getOrderDetails(String orderId) async {
    try {
      final response = await _dioClient.get('/orders/$orderId');
      
      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        return OrderTicketModel.fromJson(data).toDomain();
      } else {
        throw Exception('Failed to load order $orderId: HTTP ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error while fetching order details for $orderId: $e');
    }
  }
}
