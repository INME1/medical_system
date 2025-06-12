from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.core.paginator import Paginator
from django.db.models import Q, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import json
import logging
from orders.models import TestOrder
from orders.serializers import TestOrderSerializer

# 로깅 설정
logger = logging.getLogger(__name__)

# LIS 검사 패널 정의 (OpenMRS와 Orthanc 통합을 위한)
PANEL_COMPONENTS = {
    'CBC': ['WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'MCV', 'MCH', 'MCHC', 'Platelets'],
    'LFT': ['ALT', 'AST', 'ALP', 'GGT', 'Total Bilirubin', 'Direct Bilirubin', 'Albumin', 'Total Protein'],
    'RFT': ['BUN', 'Creatinine', 'eGFR', 'Uric Acid', 'Sodium', 'Potassium', 'Chloride'],
    'Lipid Panel': ['Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol', 'Triglycerides'],
    'Electrolyte Panel': ['Sodium', 'Potassium', 'Chloride', 'Bicarbonate'],
    'Thyroid Panel': ['TSH', 'Free T4', 'T3'],
    'Coagulation Panel': ['PT', 'INR', 'aPTT', 'Fibrinogen'],
    'Glucose': ['Fasting Blood Glucose', 'HbA1c'],
}

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def order_list_create(request):
    """
    GET: 주문 목록 조회
    POST: 새 주문 생성 (LIS 검사 요청)
    """
    if request.method == 'GET':
        try:
            # 🔥 실제 DB에서 주문 목록 조회
            orders = TestOrder.objects.all().order_by('-id')
            
            # 쿼리 파라미터 처리
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))
            status_filter = request.GET.get('status', None)
            patient_id = request.GET.get('patient_id', None)
            
            # 필터링
            if patient_id:
                orders = orders.filter(patient_id__icontains=patient_id)
            
            # 시리얼라이저로 데이터 변환
            serializer = TestOrderSerializer(orders, many=True)
            orders_data = serializer.data
            
            # 날짜 필드 추가 (호환성을 위해)
            for order in orders_data:
                if 'order_date' not in order and 'order_date' in order:
                    order['order_date'] = order['order_date']
            
            return Response({
                'status': 'success',
                'data': orders_data,
                'total': len(orders_data),
                'page': page,
                'page_size': page_size
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"주문 목록 조회 오류: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'주문 목록 조회 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            # 요청 데이터 파싱
            data = request.data
            logger.info(f"LIS 주문 생성 요청: {data}")
            
            # 필수 필드 검증
            required_fields = ['patient_id', 'patient_name', 'test_type']
            for field in required_fields:
                if not data.get(field):
                    return Response({
                        'status': 'error',
                        'message': f'필수 필드가 누락되었습니다: {field}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # 검사 패널 유효성 검증
            test_type = data.get('test_type')
            if test_type not in PANEL_COMPONENTS:
                return Response({
                    'status': 'error',
                    'message': f'지원되지 않는 검사 타입입니다: {test_type}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 🔥 실제 DB에 저장할 데이터 준비
            order_data = {
                'order_id': f"EMR_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'patient_id': data.get('patient_id'),
                'doctor_id': data.get('doctor_id', 'system_user'),
                'test_type': data.get('test_type'),
                'order_date': datetime.now()
            }
            
            # 🔥 실제 DB에 저장
            serializer = TestOrderSerializer(data=order_data)
            if serializer.is_valid():
                saved_order = serializer.save()
                
                # 응답 데이터 구성 (기존 형식 유지)
                response_data = {
                    'id': saved_order.id,
                    'patient_id': saved_order.patient_id,
                    'patient_name': data.get('patient_name'),  # TestOrder 모델에 없는 필드
                    'test_type': saved_order.test_type,
                    'test_list': data.get('test_list', ', '.join(PANEL_COMPONENTS[test_type])),
                    'doctor_id': saved_order.doctor_id,
                    'doctor_name': data.get('doctor_name', 'System User'),
                    'order_date': saved_order.order_date.strftime('%Y-%m-%d'),
                    'order_time': saved_order.order_date.strftime('%H:%M:%S'),
                    'status': 'pending',
                    'notes': data.get('notes', ''),
                    'requesting_system': data.get('requesting_system', 'CDSS-EMR'),
                    'created_at': saved_order.order_date.isoformat(),
                    'updated_at': saved_order.order_date.isoformat()
                }
                
                logger.info(f"✅ LIS 주문 DB 저장 성공: Order ID {saved_order.id}")
                
                return Response({
                    'status': 'success',
                    'message': 'LIS 검사 주문이 성공적으로 생성되었습니다.',
                    'data': response_data
                }, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"❌ DB 저장 실패: {serializer.errors}")
                return Response({
                    'status': 'error',
                    'message': f'데이터 검증 실패: {serializer.errors}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except json.JSONDecodeError:
            return Response({
                'status': 'error',
                'message': '잘못된 JSON 형식입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"LIS 주문 생성 오류: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'주문 생성 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def order_detail(request, order_id):
    """특정 주문의 상세 정보 조회/수정/삭제"""
    try:
        # 더미 주문 데이터 (실제로는 DB에서 조회)
        order = {
            'id': order_id,
            'patient_id': f'patient_{order_id}',
            'patient_name': f'Patient {order_id}',
            'test_type': 'CBC',
            'test_list': 'WBC, RBC, Hemoglobin, Hematocrit',
            'doctor_id': 'DR001',
            'doctor_name': 'System User',
            'order_date': '2025-06-12',
            'order_time': '09:30:00',
            'status': 'pending',
            'notes': f'검사 요청 #{order_id}',
            'created_at': '2025-06-12T09:30:00Z',
            'updated_at': '2025-06-12T09:30:00Z'
        }
        
        if request.method == 'GET':
            return Response({
                'status': 'success',
                'data': order
            }, status=status.HTTP_200_OK)
        
        elif request.method == 'PUT':
            # 주문 정보 업데이트
            data = request.data
            order.update(data)
            order['updated_at'] = datetime.now().isoformat()
            
            return Response({
                'status': 'success',
                'message': '주문 정보가 업데이트되었습니다.',
                'data': order
            }, status=status.HTTP_200_OK)
        
        elif request.method == 'DELETE':
            # 주문 삭제 (실제로는 soft delete)
            return Response({
                'status': 'success',
                'message': '주문이 삭제되었습니다.'
            }, status=status.HTTP_204_NO_CONTENT)
            
    except Exception as e:
        logger.error(f"주문 상세 처리 오류: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'주문 처리 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_order_status(request, order_id):
    """주문 상태 업데이트"""
    try:
        data = request.data
        new_status = data.get('status')
        
        if new_status not in ['pending', 'processing', 'completed', 'cancelled']:
            return Response({
                'status': 'error',
                'message': '유효하지 않은 상태값입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 더미 응답 (실제로는 DB 업데이트)
        updated_order = {
            'id': order_id,
            'status': new_status,
            'updated_at': datetime.now().isoformat()
        }
        
        return Response({
            'status': 'success',
            'message': f'주문 상태가 {new_status}로 업데이트되었습니다.',
            'data': updated_order
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"주문 상태 업데이트 오류: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'상태 업데이트 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def search_orders(request):
    """주문 검색"""
    try:
        query = request.GET.get('q', '')
        patient_name = request.GET.get('patient_name', '')
        test_type = request.GET.get('test_type', '')
        
        # 더미 검색 결과
        results = [
            {
                'id': 1,
                'patient_name': 'John Doe',
                'test_type': 'CBC',
                'status': 'pending',
                'order_date': '2025-06-12'
            }
        ]
        
        return Response({
            'status': 'success',
            'data': results,
            'query': query
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'검색 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def orders_by_patient(request, patient_id):
    """특정 환자의 모든 주문 조회"""
    try:
        # 더미 환자별 주문 데이터
        orders = [
            {
                'id': 1,
                'patient_id': patient_id,
                'test_type': 'CBC',
                'status': 'completed',
                'order_date': '2025-06-11'
            },
            {
                'id': 2,
                'patient_id': patient_id,
                'test_type': 'LFT',
                'status': 'pending',
                'order_date': '2025-06-12'
            }
        ]
        
        return Response({
            'status': 'success',
            'data': orders,
            'patient_id': patient_id,
            'total': len(orders)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'환자별 주문 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def pending_orders(request):
    """대기중인 주문들 조회"""
    try:
        # 더미 대기 주문 데이터
        pending_orders = [
            {
                'id': 1,
                'patient_name': 'Patient A',
                'test_type': 'CBC',
                'order_time': '09:30:00',
                'priority': 'normal'
            },
            {
                'id': 2,
                'patient_name': 'Patient B',
                'test_type': 'LFT',
                'order_time': '10:15:00',
                'priority': 'urgent'
            }
        ]
        
        return Response({
            'status': 'success',
            'data': pending_orders,
            'total': len(pending_orders)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'대기 주문 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def order_statistics(request):
    """주문 통계 정보"""
    try:
        stats = {
            'total_orders': 150,
            'pending_orders': 25,
            'completed_orders': 120,
            'cancelled_orders': 5,
            'today_orders': 12,
            'most_requested_test': 'CBC',
            'average_completion_time': '2.5 hours'
        }
        
        return Response({
            'status': 'success',
            'data': stats
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'통계 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def available_panels(request):
    """사용 가능한 검사 패널 목록"""
    try:
        panels = [
            {
                'name': panel_name,
                'components': components,
                'component_count': len(components),
                'description': f'{panel_name} 패널 검사'
            }
            for panel_name, components in PANEL_COMPONENTS.items()
        ]
        
        return Response({
            'status': 'success',
            'data': panels
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'패널 목록 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def panel_components(request, panel_name):
    """특정 패널의 구성요소 조회"""
    try:
        if panel_name not in PANEL_COMPONENTS:
            return Response({
                'status': 'error',
                'message': f'존재하지 않는 패널입니다: {panel_name}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        components = PANEL_COMPONENTS[panel_name]
        
        return Response({
            'status': 'success',
            'panel_name': panel_name,
            'components': components,
            'component_count': len(components)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'패널 구성요소 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def bulk_create_orders(request):
    """대량 주문 생성"""
    try:
        orders_data = request.data.get('orders', [])
        
        if not orders_data:
            return Response({
                'status': 'error',
                'message': '주문 데이터가 없습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 더미 대량 생성 결과
        created_orders = []
        for i, order_data in enumerate(orders_data):
            created_orders.append({
                'id': 1000 + i,
                'patient_id': order_data.get('patient_id'),
                'test_type': order_data.get('test_type'),
                'status': 'pending',
                'created_at': datetime.now().isoformat()
            })
        
        return Response({
            'status': 'success',
            'message': f'{len(created_orders)}개의 주문이 생성되었습니다.',
            'data': created_orders
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'대량 주문 생성 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def bulk_update_status(request):
    """대량 상태 업데이트"""
    try:
        order_ids = request.data.get('order_ids', [])
        new_status = request.data.get('status')
        
        if not order_ids or not new_status:
            return Response({
                'status': 'error',
                'message': '주문 ID 목록과 상태가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 더미 대량 업데이트 결과
        updated_count = len(order_ids)
        
        return Response({
            'status': 'success',
            'message': f'{updated_count}개의 주문 상태가 {new_status}로 업데이트되었습니다.',
            'updated_count': updated_count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'대량 상태 업데이트 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def integration_logs(request):
    """통합 로그 조회"""
    try:
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 50))
        
        # 더미 로그 데이터
        logs = [
            {
                'id': i,
                'timestamp': f'2025-06-12T{9+i%12:02d}:30:00Z',
                'action': 'LIS_ORDER_CREATE',
                'patient_id': f'patient_{i}',
                'result': 'success',
                'message': f'검사 주문 #{i} 생성'
            }
            for i in range(1, 21)
        ]
        
        return Response({
            'status': 'success',
            'data': logs,
            'total': len(logs),
            'page': page,
            'page_size': page_size
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'로그 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_integration_log(request):
    """통합 로그 생성"""
    try:
        data = request.data
        
        # 더미 로그 생성
        log_entry = {
            'id': 9999,
            'timestamp': datetime.now().isoformat(),
            'action': data.get('action'),
            'data': data.get('data'),
            'result': data.get('result'),
            'error': data.get('error'),
            'system': data.get('system', 'CDSS-Integration')
        }
        
        return Response({
            'status': 'success',
            'message': '로그가 생성되었습니다.',
            'data': log_entry
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'로그 생성 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)