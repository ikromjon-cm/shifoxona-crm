import 'package:dio/dio.dart';
import '../connectivity/api_queue_service.dart';
import '../connectivity/connectivity_service.dart';

class OfflineQueueInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError) {
      final online = await ConnectivityService.isOnline();
      if (!online) {
        await ApiQueueService.enqueue(
          QueuedRequest(
            method: err.requestOptions.method,
            path: err.requestOptions.path,
            data: err.requestOptions.data is Map ? err.requestOptions.data as Map<String, dynamic> : null,
          ),
        );
        handler.resolve(Response(
          requestOptions: err.requestOptions,
          data: {'offline': true, 'message': 'So\'rov oflayn rejimda navbatga qo\'yildi'},
          statusCode: 202,
        ));
        return;
      }
    }
    handler.next(err);
  }
}
