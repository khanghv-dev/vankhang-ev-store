import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import '../network/token_manager.dart';
import '../network/jwt_interceptor.dart';
import '../network/dio_client.dart';
import '../services/signalr_service.dart';
import '../../domain/repositories/scooter_repository.dart';
import '../../data/repositories/scooter_repository_impl.dart';
import '../../domain/repositories/order_repository.dart';
import '../../data/repositories/order_repository_impl.dart';

final locator = GetIt.instance;

Future<void> setupLocator() async {
  // ─── Network & Authentication ───
  locator.registerLazySingleton<TokenManager>(() => TokenManager());
  
  locator.registerLazySingleton<JwtInterceptor>(
    () => JwtInterceptor(locator<TokenManager>()),
  );
  
  locator.registerLazySingleton<Dio>(() => Dio());
  
  locator.registerLazySingleton<DioClient>(
    () => DioClient(locator<Dio>(), locator<JwtInterceptor>()),
  );

  locator.registerLazySingleton<SignalRService>(() => SignalRService());

  // ─── Repositories ───
  locator.registerLazySingleton<ScooterRepository>(
    () => ScooterRepositoryImpl(locator<DioClient>()),
  );

  locator.registerLazySingleton<OrderRepository>(
    () => OrderRepositoryImpl(locator<DioClient>()),
  );
}
