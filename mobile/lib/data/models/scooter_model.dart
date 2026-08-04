import '../../domain/entities/scooter.dart';

class ScooterModel extends Scooter {
  const ScooterModel({
    required super.id,
    required super.name,
    required super.category,
    required super.sku,
    required super.price,
    super.originalPrice,
    required super.image,
    required super.specs,
    required super.inStock,
  });

  // Factory constructor for C# .NET JSON translation with CamelCase and PascalCase robust fallbacks
  factory ScooterModel.fromJson(Map<String, dynamic> json) {
    return ScooterModel(
      id: json['id'] as String? ?? json['Id'] as String? ?? '',
      name: json['name'] as String? ?? json['Name'] as String? ?? '',
      category: json['category'] as String? ?? json['Category'] as String? ?? '',
      sku: json['sku'] as String? ?? json['Sku'] as String? ?? '',
      price: (json['price'] ?? json['Price'] ?? 0.0 as num).toDouble(),
      originalPrice: json['originalPrice'] != null
          ? (json['originalPrice'] as num).toDouble()
          : (json['OriginalPrice'] != null
              ? (json['OriginalPrice'] as num).toDouble()
              : null),
      image: json['image'] as String? ?? json['Image'] as String? ?? '',
      specs: List<String>.from(json['specs'] ?? json['Specs'] ?? const []),
      inStock: json['inStock'] as bool? ?? json['InStock'] as bool? ?? false,
    );
  }

  // Serialise to JSON for outgoing C# API payloads
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'sku': sku,
      'price': price,
      'originalPrice': originalPrice,
      'image': image,
      'specs': specs,
      'inStock': inStock,
    };
  }

  // Convert DTO Model to Pure Domain Entity
  Scooter toDomain() {
    return Scooter(
      id: id,
      name: name,
      category: category,
      sku: sku,
      price: price,
      originalPrice: originalPrice,
      image: image,
      specs: specs,
      inStock: inStock,
    );
  }
}
