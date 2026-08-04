import '../../core/network/dio_client.dart';
import '../../domain/entities/scooter.dart';
import '../../domain/repositories/scooter_repository.dart';
import '../models/scooter_model.dart';

class ScooterRepositoryImpl implements ScooterRepository {
  final DioClient _dioClient;

  ScooterRepositoryImpl(this._dioClient);

  @override
  Future<List<Scooter>> getScooters() async {
    try {
      final response = await _dioClient.get('/products');
      
      if (response.statusCode == 200) {
        final list = response.data as List<dynamic>;
        return list.map((json) => ScooterModel.fromJson(json as Map<String, dynamic>).toDomain()).toList();
      } else {
        throw Exception('Failed to load scooters: HTTP ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error while fetching scooters: $e');
    }
  }

  @override
  Future<Scooter> getScooterById(String id) async {
    try {
      final response = await _dioClient.get('/products/$id');
      
      if (response.statusCode == 200) {
        return ScooterModel.fromJson(response.data as Map<String, dynamic>).toDomain();
      } else {
        throw Exception('Failed to load scooter $id: HTTP ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error while fetching scooter $id: $e');
    }
  }
}
