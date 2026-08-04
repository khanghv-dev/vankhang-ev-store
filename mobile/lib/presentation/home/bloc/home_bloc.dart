import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/entities/scooter.dart';

// ─── Events ───
abstract class HomeEvent {
  const HomeEvent();
}

class LoadProductsEvent extends HomeEvent {
  const LoadProductsEvent();
}

// ─── States ───
abstract class HomeState {
  const HomeState();
}

class HomeInitial extends HomeState {
  const HomeInitial();
}

class HomeLoading extends HomeState {
  const HomeLoading();
}

class HomeLoaded extends HomeState {
  final List<Scooter> products;
  const HomeLoaded(this.products);
}

class HomeError extends HomeState {
  final String message;
  const HomeError(this.message);
}

// ─── BLoC ───
class HomeBloc extends Bloc<HomeEvent, HomeState> {
  HomeBloc() : super(const HomeInitial()) {
    on<LoadProductsEvent>(_onLoadProducts);
  }

  void _onLoadProducts(LoadProductsEvent event, Emitter<HomeState> emit) async {
    emit(const HomeLoading());
    try {
      // Mock API call delay
      await Future.delayed(const Duration(milliseconds: 800));

      final mockScooters = [
        const Scooter(
          id: 'vinfast-klara-s-2026',
          name: 'VinFast Klara S 2026',
          category: 'Klara',
          sku: 'SP-KLARAS-2026',
          price: 35000000,
          originalPrice: 39900000,
          image: 'assets/images/klara_ref.png',
          specs: ['Pin LFP', '194 km / sạc', 'Tốc độ 78 km/h'],
          inStock: true,
        ),
        const Scooter(
          id: 'vinfast-impes',
          name: 'VinFast Impes',
          category: 'Impes',
          sku: 'SP-IMPES-01',
          price: 12900000,
          originalPrice: 14900000,
          image: 'assets/images/impes.png',
          specs: ['Pin Lithium-ion', '70 km / sạc', 'Tốc độ 50 km/h'],
          inStock: true,
        ),
        const Scooter(
          id: 'vinfast-klara-s-premium',
          name: 'VinFast Klara S 2026 Premium',
          category: 'Klara',
          sku: 'SP-KLARAS-PREM',
          price: 36900000,
          originalPrice: 41900000,
          image: 'assets/images/klara-s.png',
          specs: ['Pin LFP kép', '194 km / sạc', 'Màu sắc thanh lịch'],
          inStock: false,
        ),
      ];

      emit(HomeLoaded(mockScooters));
    } catch (e) {
      emit(HomeError(e.toString()));
    }
  }
}
