import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/services/signalr_service.dart';
import '../../../domain/entities/order_ticket.dart';
import '../../../domain/repositories/order_repository.dart';

// ─── Events ───
abstract class DepositSuccessEvent {
  const DepositSuccessEvent();
}

class StartListeningDepositEvent extends DepositSuccessEvent {
  final String customerId;
  const StartListeningDepositEvent(this.customerId);
}

class DepositSuccessReceivedEvent extends DepositSuccessEvent {
  final String orderId;
  const DepositSuccessReceivedEvent(this.orderId);
}

class LoadOrderDetailsEvent extends DepositSuccessEvent {
  final String orderId;
  const LoadOrderDetailsEvent(this.orderId);
}

// ─── States ───
abstract class DepositSuccessState {
  const DepositSuccessState();
}

class DepositSuccessInitial extends DepositSuccessState {}

class DepositSuccessWaiting extends DepositSuccessState {}

class DepositSuccessLoading extends DepositSuccessState {}

class DepositSuccessLoaded extends DepositSuccessState {
  final OrderTicket ticket;
  const DepositSuccessLoaded(this.ticket);
}

class DepositSuccessError extends DepositSuccessState {
  final String message;
  const DepositSuccessError(this.message);
}

// ─── BLoC ───
class DepositSuccessBloc extends Bloc<DepositSuccessEvent, DepositSuccessState> {
  final SignalRService _signalRService;
  final OrderRepository _orderRepository;
  StreamSubscription<String>? _depositSubscription;

  DepositSuccessBloc({
    required SignalRService signalRService,
    required OrderRepository orderRepository,
  })  : _signalRService = signalRService,
        _orderRepository = orderRepository,
        super(DepositSuccessInitial()) {
    on<StartListeningDepositEvent>(_onStartListening);
    on<DepositSuccessReceivedEvent>(_onDepositSuccessReceived);
    on<LoadOrderDetailsEvent>(_onLoadOrderDetails);
  }

  Future<void> _onStartListening(
    StartListeningDepositEvent event,
    Emitter<DepositSuccessState> emit,
  ) async {
    emit(DepositSuccessWaiting());

    // 1. Ensure SignalR connection is active
    if (_signalRService.currentState != SignalRConnectionState.connected) {
      await _signalRService.initConnection();
    }

    // 2. Register customer on Hub so they join their private customer group
    await _signalRService.registerCustomer(event.customerId);

    // 3. Listen to the personal deposit success stream
    await _depositSubscription?.cancel();
    _depositSubscription = _signalRService.depositSuccessStream.listen((orderId) {
      add(DepositSuccessReceivedEvent(orderId));
    });
  }

  void _onDepositSuccessReceived(
    DepositSuccessReceivedEvent event,
    Emitter<DepositSuccessState> emit,
  ) {
    add(LoadOrderDetailsEvent(event.orderId));
  }

  Future<void> _onLoadOrderDetails(
    LoadOrderDetailsEvent event,
    Emitter<DepositSuccessState> emit,
  ) async {
    emit(DepositSuccessLoading());
    try {
      final ticket = await _orderRepository.getOrderDetails(event.orderId);
      emit(DepositSuccessLoaded(ticket));
    } catch (e) {
      emit(DepositSuccessError(e.toString()));
    }
  }

  @override
  Future<void> close() {
    _depositSubscription?.cancel();
    return super.close();
  }
}
