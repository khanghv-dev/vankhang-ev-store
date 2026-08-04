import '../entities/order_ticket.dart';

abstract class OrderRepository {
  Future<OrderTicket> getOrderDetails(String orderId);
}
