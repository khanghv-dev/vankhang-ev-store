class Scooter {
  final String id;
  final String name;
  final String category;
  final String sku;
  final double price;
  final double? originalPrice;
  final String image;
  final List<String> specs;
  final bool inStock;

  const Scooter({
    required this.id,
    required this.name,
    required this.category,
    required this.sku,
    required this.price,
    this.originalPrice,
    required this.image,
    required this.specs,
    required this.inStock,
  });

  double get discountPercentage {
    if (originalPrice == null || originalPrice! <= price) return 0.0;
    return ((originalPrice! - price) / originalPrice!) * 100;
  }
}
