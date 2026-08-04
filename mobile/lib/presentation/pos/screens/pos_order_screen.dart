import 'package:flutter/material.dart';
import 'qr_scanner_screen.dart';
import 'package:dio/dio.dart';

class PosOrderScreen extends StatefulWidget {
  const PosOrderScreen({super.key});

  @override
  State<PosOrderScreen> createState() => _PosOrderScreenState();
}

class _PosOrderScreenState extends State<PosOrderScreen> {
  // Form Controllers
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _vinController = TextEditingController();
  String _selectedShowroom = 'VinFast Royal City - Hà Nội';
  
  // Scooter Selection
  String _selectedModel = 'VinFast Klara S 2026';
  String _selectedBatteryOption = 'Thuê pin'; // Or 'Mua đứt pin'

  // Mock Products list for POS
  final Map<String, Map<String, dynamic>> _modelsData = {
    'VinFast Klara S 2026': {
      'price': 35000000.0,
      'sku': 'SP-KLARAS-2026',
      'specs': 'Pin LFP, 194 km / sạc, 78 km/h',
    },
    'VinFast Impes': {
      'price': 12900000.0,
      'sku': 'SP-IMPES-01',
      'specs': 'Pin Lithium-ion, 70 km / sạc, 50 km/h',
    },
    'VinFast Klara S Premium': {
      'price': 36900000.0,
      'sku': 'SP-KLARAS-PREM',
      'specs': 'Pin LFP kép, 194 km / sạc',
    },
    'VinFast Evo200 Lite': {
      'price': 19400000.0,
      'sku': 'SP-EVO200L-01',
      'specs': 'Pin LFP, 205 km / sạc, 49 km/h',
    },
  };

  final List<String> _showrooms = [
    'VinFast Royal City - Hà Nội',
    'VinFast Ocean Park - Hà Nội',
    'VinFast Landmark 81 - TP. HCM',
    'VinFast An Khánh - TP. HCM',
  ];

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _vinController.dispose();
    super.dispose();
  }

  // Activates the real QR / Barcode camera scanner screen
  Future<void> _startScanning() async {
    final String? scannedCode = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (context) => const QrScannerScreen()),
    );

    if (!mounted || scannedCode == null) return;

    _processScannedVin(scannedCode);
  }

  // Parse VIN and select corresponding model
  void _processScannedVin(String scannedCode) {
    String cleanVin = scannedCode.trim();
    if (cleanVin.toUpperCase().startsWith('VIN:')) {
      cleanVin = cleanVin.substring(4).trim();
    }

    String? matchedModel;
    final upperVin = cleanVin.toUpperCase();

    if (upperVin.contains('EVO') || upperVin.contains('EVOLITE')) {
      matchedModel = 'VinFast Evo200 Lite';
    } else if (upperVin.contains('IMPES')) {
      matchedModel = 'VinFast Impes';
    } else if (upperVin.contains('KLARAP') || upperVin.contains('PREMIUM')) {
      matchedModel = 'VinFast Klara S Premium';
    } else if (upperVin.contains('KLARAS') || upperVin.contains('KLARA S')) {
      matchedModel = 'VinFast Klara S 2026';
    }

    setState(() {
      _vinController.text = cleanVin;
      if (matchedModel != null) {
        _selectedModel = matchedModel;
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          matchedModel != null
              ? '⚡ Đã quét thành công mã QR! Tự động nhập VIN và chọn xe: $matchedModel'
              : '⚡ Đã quét thành công mã QR! Tự động nhập VIN: $cleanVin',
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _scanDeliveryTicket() async {
    final String? scannedCode = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (context) => const QrScannerScreen()),
    );

    if (!mounted || scannedCode == null) return;

    final orderIdStr = scannedCode.trim();
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFE30613)),
        ),
      ),
    );

    try {
      final dio = Dio();
      final response = await dio.get('http://10.0.2.2:5022/api/orders/$orderIdStr');
      Navigator.pop(context); // Pop loading

      if (response.statusCode == 200 && response.data != null) {
        final order = response.data;
        _showOrderVerificationDialog(orderIdStr, order);
      } else {
        _showErrorSnackBar('Không tìm thấy thông tin đơn cọc.');
      }
    } catch (e) {
      Navigator.pop(context); // Pop loading
      final mockOrder = {
        'customerName': 'Nguyễn Văn A',
        'customerPhone': '0987654321',
        'customerEmail': 'nguyenvana@gmail.com',
        'status': 'Paid',
        'items': [
          {
            'productName': 'VinFast Klara S 2026',
            'assignedVin': 'VNF-KLARAS-2026-08173'
          }
        ]
      };
      _showOrderVerificationDialog(orderIdStr, mockOrder, isFallback: true);
    }
  }

  void _showOrderVerificationDialog(String orderId, Map<String, dynamic> order, {bool isFallback = false}) {
    final items = order['items'] as List?;
    final item = (items != null && items.isNotEmpty) ? items.first : null;
    final productName = item?['productName'] ?? 'Xe máy điện VinFast';
    final assignedVin = item?['assignedVin'] ?? 'Chưa gán số VIN';
    final status = order['status'] ?? 'Pending';

    showDialog(
      context: context,
      builder: (context) {
        bool delivering = false;
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Row(
                children: [
                  Icon(Icons.verified_user_outlined, color: Colors.green),
                  SizedBox(width: 8),
                  Text('Xác thực nhận xe', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (isFallback)
                      Container(
                        padding: const EdgeInsets.all(8),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: const Text(
                          '⚠️ Chế độ giả lập (Máy chủ offline)',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber),
                        ),
                      ),
                    _buildModalInfoRow('Mã đơn cọc:', orderId),
                    _buildModalInfoRow('Khách hàng:', order['customerName'] ?? 'N/A'),
                    _buildModalInfoRow('Số điện thoại:', order['customerPhone'] ?? 'N/A'),
                    _buildModalInfoRow('Mẫu xe máy:', productName),
                    _buildModalInfoRow('Số khung / VIN:', assignedVin),
                    _buildModalInfoRow('Trạng thái cọc:', status, valueColor: status == 'Paid' ? Colors.green : Colors.orange),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('HỦY', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                ),
                ElevatedButton(
                  onPressed: (delivering || status != 'Paid') ? null : () async {
                    setModalState(() {
                      delivering = true;
                    });
                    
                    try {
                      final dio = Dio();
                      await dio.post('http://10.0.2.2:5022/api/orders/$orderId/deliver');
                      Navigator.pop(context); // Close modal
                      _showSuccessDialog('Bàn giao xe thành công!', 'Đơn hàng $orderId đã chuyển sang trạng thái DELIVERED. Trạng thái xe trong kho đã được chuyển thành SOLD.');
                    } catch (e) {
                      Navigator.pop(context); // Close modal
                      if (isFallback) {
                        _showSuccessDialog('Bàn giao xe thành công (MOCK)!', 'Hệ thống giả lập ghi nhận bàn giao xe thành công cho đơn cọc $orderId.');
                      } else {
                        _showErrorSnackBar('Lỗi hệ thống khi bàn giao xe: $e');
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE30613),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey.shade300,
                  ),
                  child: delivering 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                    : const Text('BÀN GIAO XE', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            );
          }
        );
      }
    );
  }

  Widget _buildModalInfoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 12, 
                fontWeight: FontWeight.bold, 
                color: valueColor ?? Colors.black87
              )
            ),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFFE30613),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showSuccessDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Colors.green),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        content: Text(message, style: const TextStyle(fontSize: 13, height: 1.4)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      )
    );
  }

  Widget _buildDeliveryTicketCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.qr_code_2_outlined, color: Color(0xFFE30613)),
                SizedBox(width: 8),
                Text(
                  'QUÉT VÉ NHẬN XE KHÁCH HÀNG',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.5),
                ),
              ],
            ),
            const Divider(height: 24, color: Color(0xFFF3F4F6)),
            const Text(
              'Nhân viên showroom sử dụng camera quét mã QR vé nhận xe trên điện thoại khách hàng để kiểm tra thông tin cọc và bàn giao xe máy điện.',
              style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.4),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _scanDeliveryTicket,
              icon: const Icon(Icons.qr_code_scanner_outlined),
              label: const Text('BẮT ĐẦU QUÉT VÉ NHẬN XE'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE30613),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                minimumSize: const Size(double.infinity, 50),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Calculate pricing formulas
  double get _basePrice => _modelsData[_selectedModel]?['price'] ?? 0.0;
  double get _batteryFee => _selectedBatteryOption == 'Thuê pin' ? 0.0 : 19900000.0;
  double get _taxFee => (_basePrice + _batteryFee) * 0.10; // 10% VAT
  double get _totalPrice => _basePrice + _batteryFee + _taxFee;
  double get _depositAmount => _totalPrice * 0.20; // 20% minimum deposit

  String _formatCurrency(double val) {
    return '${val.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')} ₫';
  }

  @override
  Widget build(BuildContext context) {
    // Check width to adjust multi-columns or single list
    final width = MediaQuery.of(context).size.width;
    final isDesktop = width > 900;

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        title: const Text(
          'LẬP ĐƠN HÀNG TẠI QUẦY (SHOWROOM POS)',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 0.5),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: isDesktop ? _buildDesktopLayout() : _buildMobileLayout(),
        ),
      ),
    );
  }

  Widget _buildDesktopLayout() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Left Column: Customer Form & QR Trigger (Column weight 7)
        Expanded(
          flex: 7,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildDeliveryTicketCard(),
              const SizedBox(height: 24),
              _buildCustomerInfoCard(),
              const SizedBox(height: 24),
              _buildVehicleScanCard(),
            ],
          ),
        ),
        const SizedBox(width: 24),
        // Right Column: Scooter Selector & Pricing calculation (Column weight 5)
        Expanded(
          flex: 5,
          child: Column(
            children: [
              _buildProductSelectorCard(),
              const SizedBox(height: 24),
              _buildReceiptCard(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMobileLayout() {
    return Column(
      children: [
        _buildDeliveryTicketCard(),
        const SizedBox(height: 24),
        _buildCustomerInfoCard(),
        const SizedBox(height: 24),
        _buildVehicleScanCard(),
        const SizedBox(height: 24),
        _buildProductSelectorCard(),
        const SizedBox(height: 24),
        _buildReceiptCard(),
      ],
    );
  }

  // ─── Left Section Form Panels ───
  Widget _buildCustomerInfoCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.person_outline, color: Color(0xFFE30613)),
                SizedBox(width: 8),
                Text(
                  'THÔNG TIN KHÁCH HÀNG',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.5),
                ),
              ],
            ),
            const Divider(height: 24, color: Color(0xFFF3F4F6)),
            
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Họ và tên khách hàng *',
                border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                prefixIcon: Icon(Icons.badge_outlined),
              ),
              validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập tên khách hàng' : null,
            ),
            const SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _phoneController,
                    decoration: const InputDecoration(
                      labelText: 'Số điện thoại liên hệ *',
                      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    keyboardType: TextInputType.phone,
                    validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập số điện thoại' : null,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _emailController,
                    decoration: const InputDecoration(
                      labelText: 'Địa chỉ Email *',
                      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                      prefixIcon: Icon(Icons.mail_outline),
                    ),
                    keyboardType: TextInputType.emailAddress,
                    validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập email' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            DropdownButtonFormField<String>(
              value: _selectedShowroom,
              decoration: const InputDecoration(
                labelText: 'Showroom giao xe *',
                border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                prefixIcon: Icon(Icons.storefront_outlined),
              ),
              items: _showrooms.map((room) {
                return DropdownMenuItem(value: room, child: Text(room));
              }).toList(),
              onChanged: (val) => setState(() => _selectedShowroom = val!),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVehicleScanCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.qr_code_scanner, color: Color(0xFFE30613)),
                SizedBox(width: 8),
                Text(
                  'QUÉT ĐỊNH DANH XE TẠI QUẦY (QR / VIN)',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.5),
                ),
              ],
            ),
            const Divider(height: 24, color: Color(0xFFF3F4F6)),
            
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _vinController,
                    decoration: const InputDecoration(
                      labelText: 'Số khung / Mã VIN định danh xe *',
                      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
                      hintText: 'Nhập tay hoặc kích hoạt quét tự động',
                      prefixIcon: Icon(Icons.numbers_outlined),
                    ),
                    validator: (val) => val == null || val.isEmpty ? 'Vui lòng điền mã số VIN xe' : null,
                  ),
                ),
                const SizedBox(width: 16),
                
                // Camera Scanner Action Button
                ElevatedButton.icon(
                  onPressed: _startScanning,
                  icon: const Icon(Icons.videocam_outlined),
                  label: const Text('BẮT ĐẦU QUÉT CAMERA'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF111827),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─── Right Section Selector Panels ───
  Widget _buildProductSelectorCard() {
    final activeSpecs = _modelsData[_selectedModel]?['specs'] ?? '';
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.electric_scooter_outlined, color: Color(0xFFE30613)),
                SizedBox(width: 8),
                Text(
                  'CHỌN DÒNG XE & LOẠI PIN',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.5),
                ),
              ],
            ),
            const Divider(height: 24, color: Color(0xFFF3F4F6)),
            
            DropdownButtonFormField<String>(
              value: _selectedModel,
              decoration: const InputDecoration(
                labelText: 'Mẫu xe máy điện *',
                border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
              ),
              items: _modelsData.keys.map((model) {
                return DropdownMenuItem(value: model, child: Text(model));
              }).toList(),
              onChanged: (val) => setState(() => _selectedModel = val!),
            ),
            const SizedBox(height: 12),
            
            // Specs tag
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Text(
                'Thông số: $activeSpecs',
                style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 16),
            
            // Battery Option (Radio Buttons)
            const Text(
              'Gói Pin sử dụng:',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: RadioListTile<String>(
                    title: const Text('Thuê Pin', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    value: 'Thuê pin',
                    groupValue: _selectedBatteryOption,
                    contentPadding: EdgeInsets.zero,
                    activeColor: const Color(0xFFE30613),
                    onChanged: (val) => setState(() => _selectedBatteryOption = val!),
                  ),
                ),
                Expanded(
                  child: RadioListTile<String>(
                    title: const Text('Mua đứt Pin', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    value: 'Mua đứt pin',
                    groupValue: _selectedBatteryOption,
                    contentPadding: EdgeInsets.zero,
                    activeColor: const Color(0xFFE30613),
                    onChanged: (val) => setState(() => _selectedBatteryOption = val!),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReceiptCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.receipt_long_outlined, color: Color(0xFFE30613)),
                SizedBox(width: 8),
                Text(
                  'CHI TIẾT THANH TOÁN',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.5),
                ),
              ],
            ),
            const Divider(height: 24, color: Color(0xFFF3F4F6)),
            
            // Item price listings
            _buildReceiptRow('Giá xe gốc:', _formatCurrency(_basePrice)),
            const SizedBox(height: 10),
            _buildReceiptRow('Tùy chọn Pin:', _formatCurrency(_batteryFee)),
            const SizedBox(height: 10),
            _buildReceiptRow('Thuế VAT (10%):', _formatCurrency(_taxFee)),
            const SizedBox(height: 12),
            
            const Divider(color: Color(0xFFF3F4F6)),
            const SizedBox(height: 12),
            
            // Total Price
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'TỔNG GIÁ TRỊ ĐƠN:',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF111827)),
                ),
                Text(
                  _formatCurrency(_totalPrice),
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFFE30613)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            
            // Deposit amount details
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Tiền đặt cọc trước (20%):',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                ),
                Text(
                  _formatCurrency(_depositAmount),
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Submit Checkout Button (VinFast Red)
            ElevatedButton(
              onPressed: () {
                if (_formKey.currentState!.validate()) {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      title: const Text('🎉 Lập đơn hàng thành công!', style: TextStyle(fontWeight: FontWeight.bold)),
                      content: Text(
                        'Đơn đặt cọc xe $_selectedModel của khách hàng ${_nameController.text} đã được ghi nhận thành công.\nShowroom bàn giao: $_selectedShowroom.',
                        style: const TextStyle(fontSize: 13, height: 1.5),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () {
                            Navigator.pop(context);
                            _formKey.currentState!.reset();
                            _nameController.clear();
                            _phoneController.clear();
                            _emailController.clear();
                            _vinController.clear();
                          },
                          child: const Text('XÁC NHẬN'),
                        ),
                      ],
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE30613), // VinFast Red
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                minimumSize: const Size(double.infinity, 54),
                elevation: 2,
                shadowColor: const Color.fromARGB(90, 227, 6, 19),
              ),
              child: const Text(
                'XÁC NHẬN LẬP ĐƠN HÀNG',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 1),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF495057), fontWeight: FontWeight.w500)),
        Text(value, style: const TextStyle(fontSize: 13, color: Color(0xFF111827), fontWeight: FontWeight.bold)),
      ],
    );
  }


}
