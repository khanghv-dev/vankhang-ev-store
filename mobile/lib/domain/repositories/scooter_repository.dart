import '../entities/scooter.dart';

abstract class ScooterRepository {
  Future<List<Scooter>> getScooters();
  Future<Scooter> getScooterById(String id);
}
