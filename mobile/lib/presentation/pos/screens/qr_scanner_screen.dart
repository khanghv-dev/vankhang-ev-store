import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> with SingleTickerProviderStateMixin {
  late final MobileScannerController _controller;
  late final AnimationController _animationController;
  bool _isScanned = false;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
      torchEnabled: false,
    );

    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    _animationController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isScanned) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? rawValue = barcodes.first.rawValue;
      if (rawValue != null && rawValue.trim().isNotEmpty) {
        setState(() {
          _isScanned = true;
        });
        
        // Return decoded value back to screen
        Navigator.pop(context, rawValue.trim());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final viewfinderWidth = size.width * 0.7;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // ─── Camera Stream ───
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error, stackTrace) {
              return Center(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  margin: const EdgeInsets.symmetric(horizontal: 32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, color: Color(0xFFE30613), size: 48),
                      const SizedBox(height: 16),
                      const Text(
                        'Lỗi máy ảnh',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Không thể truy cập máy ảnh. Vui lòng kiểm tra quyền truy cập camera trong Cài đặt hệ thống.\n\nChi tiết: ${error.errorCode}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 13, color: Colors.grey, height: 1.4),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE30613),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Đóng'),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          // ─── Custom Viewfinder Overlay ───
          Positioned.fill(
            child: CustomPaint(
              painter: ScannerOverlayPainter(viewfinderWidth: viewfinderWidth),
            ),
          ),

          // ─── Sweeping Laser Animation ───
          Positioned.fill(
            child: Center(
              child: SizedBox(
                width: viewfinderWidth,
                height: viewfinderWidth,
                child: Stack(
                  children: [
                    AnimatedBuilder(
                      animation: _animationController,
                      builder: (context, child) {
                        final topOffset = viewfinderWidth * _animationController.value;
                        return Positioned(
                          top: topOffset,
                          left: 10,
                          right: 10,
                          child: Container(
                            height: 3,
                            decoration: BoxDecoration(
                              color: const Color(0xFFE30613),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFE30613).withOpacity(0.8),
                                  blurRadius: 10,
                                  spreadRadius: 3,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ─── UI Overlay Controls ───
          SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top Navigation Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Back Button
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.black45,
                        ),
                      ),
                      // Screen Title
                      const Text(
                        'QUÉT MÃ XE MÁY ĐIỆN',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1,
                        ),
                      ),
                      // Empty placeholder to balance center title alignment
                      const SizedBox(width: 48),
                    ],
                  ),
                ),

                // Bottom Instruction & Camera controls
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      // Instruction Panel
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: const Text(
                          'Di chuyển camera tới mã QR hoặc Barcode dán trên cổ xe máy điện để tự động nhận dạng mã số VIN.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            height: 1.4,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Control Buttons Bar
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Torch Control
                          ValueListenableBuilder<MobileScannerState>(
                            valueListenable: _controller,
                            builder: (context, state, child) {
                              final isTorchOn = state.torchState == TorchState.on;
                              return CircleAvatar(
                                radius: 28,
                                backgroundColor: isTorchOn ? const Color(0xFFE30613) : Colors.black54,
                                child: IconButton(
                                  icon: Icon(
                                    isTorchOn ? Icons.flash_on : Icons.flash_off,
                                    color: Colors.white,
                                  ),
                                  onPressed: () => _controller.toggleTorch(),
                                ),
                              );
                            },
                          ),
                          const SizedBox(width: 24),
                          // Camera Facade Flip
                          ValueListenableBuilder<MobileScannerState>(
                            valueListenable: _controller,
                            builder: (context, state, child) {
                              return CircleAvatar(
                                radius: 28,
                                backgroundColor: Colors.black54,
                                child: IconButton(
                                  icon: const Icon(
                                    Icons.cameraswitch,
                                    color: Colors.white,
                                  ),
                                  onPressed: () => _controller.switchCamera(),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ScannerOverlayPainter extends CustomPainter {
  final double viewfinderWidth;

  ScannerOverlayPainter({required this.viewfinderWidth});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black.withOpacity(0.7)
      ..style = PaintingStyle.fill;

    // Viewfinder dimensions
    final width = viewfinderWidth;
    final height = width;
    final left = (size.width - width) / 2;
    final top = (size.height - height) / 2;
    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(left, top, width, height),
      const Radius.circular(20),
    );

    // Draw overlay background with cutout
    canvas.drawPath(
      Path.combine(
        PathOperation.difference,
        Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height)),
        Path()..addRRect(rect),
      ),
      paint,
    );

    // Draw viewfinder borders
    final borderPaint = Paint()
      ..color = const Color(0xFFE30613).withOpacity(0.3) // Light VinFast Red outline
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    canvas.drawRRect(rect, borderPaint);

    // Draw corner brackets
    final cornerPaint = Paint()
      ..color = const Color(0xFFE30613) // VinFast Red highlight
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0;

    const double cornerSize = 25.0;

    // Top-Left corner
    canvas.drawPath(
      Path()
        ..moveTo(left, top + cornerSize)
        ..lineTo(left, top)
        ..lineTo(left + cornerSize, top),
      cornerPaint,
    );
    // Top-Right corner
    canvas.drawPath(
      Path()
        ..moveTo(left + width - cornerSize, top)
        ..lineTo(left + width, top)
        ..lineTo(left + width, top + cornerSize),
      cornerPaint,
    );
    // Bottom-Left corner
    canvas.drawPath(
      Path()
        ..moveTo(left, top + height - cornerSize)
        ..lineTo(left, top + height)
        ..lineTo(left + cornerSize, top + height),
      cornerPaint,
    );
    // Bottom-Right corner
    canvas.drawPath(
      Path()
        ..moveTo(left + width - cornerSize, top + height)
        ..lineTo(left + width, top + height)
        ..lineTo(left + width, top + height - cornerSize),
      cornerPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
