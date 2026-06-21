import 'package:dio/dio.dart';
import 'api_client.dart';

class ApiService {
  static Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? params}) async {
    final res = await ApiClient.dio.get(path, queryParameters: params);
    return res.data;
  }

  static Future<List<dynamic>> getList(String path, {Map<String, dynamic>? params}) async {
    final res = await ApiClient.dio.get(path, queryParameters: params);
    final data = res.data;
    if (data is List) return data;
    return data['results'] ?? data['data'] ?? [];
  }

  static Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? data}) async {
    final res = await ApiClient.dio.post(path, data: data);
    return res.data;
  }

  static Future<Map<String, dynamic>> patch(String path, {Map<String, dynamic>? data}) async {
    final res = await ApiClient.dio.patch(path, data: data);
    return res.data;
  }

  static Future<void> delete(String path) async {
    await ApiClient.dio.delete(path);
  }

  static Future<Map<String, dynamic>> uploadFile(String path, String filePath) async {
    final formData = FormData.fromMap({'file': await MultipartFile.fromFile(filePath)});
    final res = await ApiClient.dio.post(path, data: formData);
    return res.data;
  }
}
