import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/di/injection.dart';
import '../../../core/services/signalr_service.dart';
import '../../../domain/repositories/order_repository.dart';
import '../bloc/deposit_success_bloc.dart';

class DepositSuccessScreen extends StatelessWidget {
  final String customerId;

  const DepositSuccessScreen({
    super.key,
    required this.customerId,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => DepositSuccessBloc(
        signalRService: locator<SignalRService>(),
        orderRepository: locator<OrderRepository>(),
      )..add(StartListeningDepositEvent(customerId)),
      child: const DepositSuccessView(),
    );
  }
}

class DepositSuccessView extends StatefulWidget {
  const DepositSuccessView({super.key});

  @override
  State<DepositSuccessView> createState() => _DepositSuccessViewState();
}

class _DepositSuccessViewState extends State<DepositSuccessView>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _scaleAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.elasticOut,
    );
    _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        title: const Text(
          'Vé nhận xe điện tử',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        automaticallyImplyLeading: false,
      ),
      body: BlocConsumer<DepositSuccessBloc, DepositSuccessState>(
        listener: (context, state) {
          if (state is DepositSuccessLoaded) {
            _animController.forward(from: 0.0);
          }
        },
        builder: (context, state) {
          if (state is DepositSuccessWaiting) {
            return _buildWaitingState();
          } else if (state is DepositSuccessLoading) {
            return const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFE30613)),
              ),
            );
          } else if (state is DepositSuccessLoaded) {
            return _buildLoadedState(state);
          } else if (state is DepositSuccessError) {
            return _buildErrorState(state);
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildWaitingState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                // Soft background circles to represent SignalR waves
                Container(
                  height: 130,
                  width: 130,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE30613).withOpacity(0.05),
                    shape: BoxShape.circle,
                  ),
                ),
                Container(
                  height: 100,
                  width: 100,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE30613).withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                ),
                Container(
                  height: 70,
                  width: 70,
                  decoration: const BoxDecoration(
                    color: Color(0xFFE30613),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.sensors,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            const Text(
              'Chờ xác nhận thanh toán',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 12),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                'Ứng dụng đang kết nối qua SignalR và lắng nghe tín hiệu đặt cọc thành công trực tuyến của bạn để xuất vé tự động...',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey,
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 24),
            const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFE30613)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadedState(DepositSuccessLoaded state) {
    final ticket = state.ticket;
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child: Column(
        children: [
          // Animated checkmark
          FadeTransition(
            opacity: _opacityAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: Container(
                height: 72,
                width: 72,
                decoration: const BoxDecoration(
                  color: Colors.green,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x3300FF00),
                      blurRadius: 12,
                      offset: Offset(0, 4),
                    )
                  ],
                ),
                child: const Icon(
                  Icons.check,
                  color: Colors.white,
                  size: 40,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Đặt cọc thành công!',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Vé điện tử của bạn đã được khởi tạo',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 24),
          
          // Ticket Card UI
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 15,
                  offset: Offset(0, 8),
                )
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Column(
                children: [
                  // Upper Ticket Part
                  Container(
                    padding: const EdgeInsets.all(24),
                    color: Colors.white,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'VÉ ĐIỆN TỬ NHẬN XE',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFFE30613),
                                letterSpacing: 1,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFE30613).withOpacity(0.08),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'ĐÃ ĐẶT CỌC',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFE30613),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildTicketField('Dòng xe điện', ticket.vehicleName, isBoldValue: true),
                        const SizedBox(height: 12),
                        _buildTicketField('Số khung (VIN)', ticket.vin, isMonoValue: true),
                        const SizedBox(height: 12),
                        _buildTicketField('Showroom nhận xe', ticket.showroomName),
                        const SizedBox(height: 4),
                        Text(
                          ticket.showroomAddress,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.grey,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Dashed Line Separator with punch holes
                  _buildTicketSeparator(),
                  
                  // Lower Ticket Part
                  Container(
                    padding: const EdgeInsets.all(24),
                    color: const Color(0xFFFAFAFA),
                    child: Column(
                      children: [
                        // QR Code center
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: QrImageView(
                            data: ticket.orderId,
                            version: QrVersions.auto,
                            size: 160.0,
                            gapless: false,
                            errorStateBuilder: (cxt, err) {
                              return const Center(child: Text("Không thể vẽ QR Code"));
                            },
                          ),
                        ),
                        const SizedBox(height: 20),
                        
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Số tiền đặt cọc',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey,
                              ),
                            ),
                            Text(
                              '${ticket.depositAmount.toStringAsFixed(0)} ₫',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFFE30613),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Thời gian thanh toán',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey,
                              ),
                            ),
                            Text(
                              '${ticket.paidAt.day}/${ticket.paidAt.month}/${ticket.paidAt.year} ${ticket.paidAt.hour.toString().padLeft(2, '0')}:${ticket.paidAt.minute.toString().padLeft(2, '0')}',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF111827),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Back Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF111827),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Quay lại trang chủ',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketSeparator() {
    return Row(
      children: [
        // Left cut hole
        Container(
          height: 20,
          width: 10,
          decoration: const BoxDecoration(
            color: Color(0xFFF3F4F6),
            borderRadius: BorderRadius.only(
              topRight: Radius.circular(10),
              bottomRight: Radius.circular(10),
            ),
          ),
        ),
        // Dashed middle line
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return Flex(
                direction: Axis.horizontal,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(
                  (constraints.constrainWidth() / 10).floor(),
                  (index) => SizedBox(
                    width: 5,
                    height: 1,
                    child: DecoratedBox(
                      decoration: BoxDecoration(color: Colors.grey.shade300),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        // Right cut hole
        Container(
          height: 20,
          width: 10,
          decoration: const BoxDecoration(
            color: Color(0xFFF3F4F6),
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(10),
              bottomLeft: Radius.circular(10),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTicketField(String label, String value, {bool isBoldValue = false, bool isMonoValue = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isBoldValue ? FontWeight.w900 : (isMonoValue ? FontWeight.w500 : FontWeight.bold),
            color: const Color(0xFF111827),
            fontFamily: isMonoValue ? 'Courier' : null,
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState(DepositSuccessError state) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              color: Color(0xFFE30613),
              size: 56,
            ),
            const SizedBox(height: 20),
            const Text(
              'Có lỗi xảy ra',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              state.message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE30613),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Quay lại'),
            ),
          ],
        ),
      ),
    );
  }
}
