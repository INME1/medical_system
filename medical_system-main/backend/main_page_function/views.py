# backend/main_page_function/views.py

from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta, date
from django.core.paginator import Paginator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import logging

# 기존 모델들 import (안전하게 처리)
try:
    from openmrs_models.models import Patient, Person, Encounter
except ImportError:
    Patient = Person = Encounter = None
    print("OpenMRS 모델을 찾을 수 없습니다. 더미 데이터를 사용합니다.")

try:
    from worklist.models import StudyRequest
except ImportError:
    StudyRequest = None
    print("Worklist 모델을 찾을 수 없습니다.")

try:
    from orders_emr.models import Order
except ImportError:
    Order = None
    print("Orders EMR 모델을 찾을 수 없습니다.")

from .models import Notice, DoctorStats
from .serializers import NoticeSerializer, DoctorStatsSerializer

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_main_page_data(request):
    """메인 페이지에 필요한 모든 데이터 조회"""
    try:
        doctor_id = request.GET.get('doctor_id', 'default_doctor')
        
        # 1. 의사 정보 및 통계
        doctor_stats = get_or_create_doctor_stats(doctor_id)
        
        # 2. 활성 공지사항 (최대 5개) - Q 사용으로 수정
        active_notices = Notice.objects.filter(
            is_active=True,
            start_date__lte=timezone.now()
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=timezone.now())
        )[:5]
        
        # 3. 오늘 일정
        today_schedule = get_today_schedule(doctor_id)
        
        # 4. 메시지 수 (더미 데이터)
        unread_messages = 7
        
        response_data = {
            'doctor_info': {
                'name': doctor_stats.doctor_name,
                'department': doctor_stats.department,
                'status': doctor_stats.status,
                'status_display': doctor_stats.get_status_display()
            },
            'stats': {
                'today_patients': doctor_stats.today_patients,
                'waiting_patients': doctor_stats.waiting_patients,
                'unread_messages': unread_messages
            },
            'notices': NoticeSerializer(active_notices, many=True).data,
            'schedule': today_schedule,
            'last_updated': timezone.now().isoformat()
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"메인 페이지 데이터 조회 오류: {str(e)}")
        return Response({
            'error': f'메인 페이지 데이터 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def get_or_create_doctor_stats(doctor_id):
    """의사 통계 조회 또는 생성"""
    try:
        doctor_stats = DoctorStats.objects.get(doctor_id=doctor_id)
        
        # 오늘 데이터가 아니면 업데이트
        if doctor_stats.last_updated.date() != timezone.now().date():
            update_doctor_stats(doctor_stats)
        
        return doctor_stats
        
    except DoctorStats.DoesNotExist:
        # 새로 생성
        return create_doctor_stats(doctor_id)

def create_doctor_stats(doctor_id):
    """새 의사 통계 생성"""
    doctor_mapping = {
        'default_doctor': {'name': '김의사', 'department': '내과'},
        'doctor_1': {'name': '이의사', 'department': '외과'},
        'doctor_2': {'name': '박의사', 'department': '소아과'},
    }
    
    doctor_info = doctor_mapping.get(doctor_id, {'name': '김의사', 'department': '내과'})
    
    # 오늘 통계 계산 (안전하게 처리)
    today = timezone.now().date()
    today_patients = 0
    waiting_patients = 0
    
    # Encounter 모델이 있을 때만 실제 데이터 조회
    if Encounter:
        try:
            today_patients = Encounter.objects.filter(
                encounter_datetime__date=today,
                voided=False,
                creator=1
            ).count()
        except Exception as e:
            logger.warning(f"Encounter 데이터 조회 실패: {e}")
            today_patients = 15  # 더미 데이터
    else:
        today_patients = 15  # 더미 데이터
    
    # StudyRequest 모델이 있을 때만 실제 데이터 조회
    if StudyRequest:
        try:
            waiting_patients = StudyRequest.objects.filter(
                study_status='requested',
                requesting_physician=doctor_info['name']
            ).count()
        except Exception as e:
            logger.warning(f"StudyRequest 데이터 조회 실패: {e}")
            waiting_patients = 3  # 더미 데이터
    else:
        waiting_patients = 3  # 더미 데이터
    
    doctor_stats = DoctorStats.objects.create(
        doctor_id=doctor_id,
        doctor_name=doctor_info['name'],
        department=doctor_info['department'],
        today_patients=today_patients,
        waiting_patients=waiting_patients,
        status='online'
    )
    
    return doctor_stats

def update_doctor_stats(doctor_stats):
    """의사 통계 업데이트"""
    today = timezone.now().date()
    today_patients = 0
    waiting_patients = 0
    
    # 안전하게 데이터 업데이트
    if Encounter:
        try:
            today_patients = Encounter.objects.filter(
                encounter_datetime__date=today,
                voided=False,
                creator=1
            ).count()
        except Exception:
            today_patients = doctor_stats.today_patients  # 기존 값 유지
    
    if StudyRequest:
        try:
            waiting_patients = StudyRequest.objects.filter(
                study_status='requested',
                requesting_physician=doctor_stats.doctor_name
            ).count()
        except Exception:
            waiting_patients = doctor_stats.waiting_patients  # 기존 값 유지
    
    doctor_stats.today_patients = today_patients
    doctor_stats.waiting_patients = waiting_patients
    doctor_stats.save()

def get_today_schedule(doctor_id):
    """오늘 일정 조회 (더미 데이터)"""
    return [
        {
            'time': '14:00',
            'type': '진료',
            'description': '고혈압 환자',
            'patient_id': 'P001'
        },
        {
            'time': '16:00', 
            'type': '진료',
            'description': '두통 환자',
            'patient_id': 'P002'
        },
        {
            'time': '18:00',
            'type': '회의',
            'description': '의료진 미팅',
            'patient_id': None
        }
    ]

@api_view(['GET'])
@permission_classes([AllowAny])
def get_notices(request):
    """공지사항 목록 조회"""
    try:
        notices = Notice.objects.filter(
            is_active=True,
            start_date__lte=timezone.now()
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=timezone.now())  # Q 사용으로 수정
        )
        
        # 쿼리 파라미터 처리
        notice_type = request.GET.get('type')
        if notice_type:
            notices = notices.filter(notice_type=notice_type)
            
        page_size = int(request.GET.get('page_size', 10))
        notices = notices[:page_size]
        
        serializer = NoticeSerializer(notices, many=True)
        return Response({
            'status': 'success',
            'data': serializer.data,
            'count': len(serializer.data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"공지사항 조회 오류: {str(e)}")
        return Response({
            'error': f'공지사항 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_notices_board(request):
    """공지사항 게시판용 API (페이징, 검색, 필터링 지원)"""
    try:
        print(f"📡 공지사항 게시판 API 호출됨: {request.method} {request.path}")
        print(f"📊 쿼리 파라미터: {request.GET}")
        notice_count = Notice.objects.count()
        print(f"📋 Notice 테이블 데이터 수: {notice_count}")
        # 쿼리 파라미터
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        search = request.GET.get('search', '')
        notice_type = request.GET.get('type', '')
        show_inactive = request.GET.get('show_inactive', 'false').lower() == 'true'
        
        # 기본 쿼리셋
        queryset = Notice.objects.all()
        
        # 활성 상태 필터
        if not show_inactive:
            queryset = queryset.filter(
                is_active=True,
                start_date__lte=timezone.now()
            ).filter(
                Q(end_date__isnull=True) | Q(end_date__gte=timezone.now())
            )
        
        # 검색
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search) |
                Q(created_by__icontains=search)
            )
        
        # 타입 필터
        if notice_type:
            queryset = queryset.filter(notice_type=notice_type)
        
        # 정렬 (고정 공지사항이 위로)
        queryset = queryset.order_by('-is_pinned', '-created_at')
        
        # 페이징
        paginator = Paginator(queryset, page_size)
        
        if page > paginator.num_pages and paginator.num_pages > 0:
            page = paginator.num_pages
        
        page_obj = paginator.get_page(page)
        
        # 시리얼라이저
        serializer = NoticeSerializer(page_obj.object_list, many=True)
        
        # 통계
        total_count = queryset.count()
        active_count = Notice.objects.filter(is_active=True).count()
        pinned_count = Notice.objects.filter(is_pinned=True, is_active=True).count()
        
        return Response({
            'status': 'success',
            'data': serializer.data,
            'pagination': {
                'current_page': page,
                'total_pages': paginator.num_pages,
                'page_size': page_size,
                'total_count': total_count,
                'has_previous': page_obj.has_previous(),
                'has_next': page_obj.has_next(),
                'previous_page': page_obj.previous_page_number() if page_obj.has_previous() else None,
                'next_page': page_obj.next_page_number() if page_obj.has_next() else None,
            },
            'statistics': {
                'total_count': total_count,
                'active_count': active_count,
                'pinned_count': pinned_count,
                'type_counts': {
                    'important': Notice.objects.filter(notice_type='important', is_active=True).count(),
                    'update': Notice.objects.filter(notice_type='update', is_active=True).count(),
                    'maintenance': Notice.objects.filter(notice_type='maintenance', is_active=True).count(),
                    'general': Notice.objects.filter(notice_type='general', is_active=True).count(),
                }
            },
            'filters': {
                'search': search,
                'type': notice_type,
                'show_inactive': show_inactive
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"공지사항 게시판 조회 오류: {str(e)}")
        return Response({
            'error': f'공지사항 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_notice_detail(request, notice_id):
    """공지사항 상세 조회"""
    try:
        notice = Notice.objects.get(id=notice_id)
        
        # 조회수 증가
        notice.increment_views()
        
        serializer = NoticeSerializer(notice)
        
        # 이전/다음 공지사항
        prev_notice = Notice.objects.filter(
            id__lt=notice_id,
            is_active=True
        ).order_by('-id').first()
        
        next_notice = Notice.objects.filter(
            id__gt=notice_id,
            is_active=True
        ).order_by('id').first()
        
        return Response({
            'status': 'success',
            'data': serializer.data,
            'navigation': {
                'previous': {
                    'id': prev_notice.id,
                    'title': prev_notice.title
                } if prev_notice else None,
                'next': {
                    'id': next_notice.id,
                    'title': next_notice.title
                } if next_notice else None
            }
        }, status=status.HTTP_200_OK)
        
    except Notice.DoesNotExist:
        return Response({
            'error': '공지사항을 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"공지사항 상세 조회 오류: {str(e)}")
        return Response({
            'error': f'공지사항 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_notice(request):
    """공지사항 생성"""
    try:
        data = request.data.copy()
        
        # 작성자 정보 추가
        if not data.get('created_by'):
            data['created_by'] = 'admin'
        
        serializer = NoticeSerializer(data=data)
        if serializer.is_valid():
            notice = serializer.save()
            
            return Response({
                'status': 'success',
                'message': '공지사항이 생성되었습니다.',
                'data': NoticeSerializer(notice).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'status': 'error',
                'message': '공지사항 생성 실패',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"공지사항 생성 오류: {str(e)}")
        return Response({
            'error': f'공지사항 생성 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_notice(request, notice_id):
    """공지사항 수정"""
    try:
        notice = Notice.objects.get(id=notice_id)
        serializer = NoticeSerializer(notice, data=request.data, partial=True)
        
        if serializer.is_valid():
            updated_notice = serializer.save()
            
            return Response({
                'status': 'success',
                'message': '공지사항이 수정되었습니다.',
                'data': NoticeSerializer(updated_notice).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'error',
                'message': '공지사항 수정 실패',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Notice.DoesNotExist:
        return Response({
            'error': '공지사항을 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"공지사항 수정 오류: {str(e)}")
        return Response({
            'error': f'공지사항 수정 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_notice(request, notice_id):
    """공지사항 삭제 (비활성화)"""
    try:
        notice = Notice.objects.get(id=notice_id)
        
        # 실제 삭제 대신 비활성화
        notice.is_active = False
        notice.save()
        
        return Response({
            'status': 'success',
            'message': '공지사항이 삭제되었습니다.'
        }, status=status.HTTP_200_OK)
        
    except Notice.DoesNotExist:
        return Response({
            'error': '공지사항을 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"공지사항 삭제 오류: {str(e)}")
        return Response({
            'error': f'공지사항 삭제 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_doctor_status(request, doctor_id):
    """의사 상태 업데이트"""
    try:
        doctor_stats = DoctorStats.objects.get(doctor_id=doctor_id)
        new_status = request.data.get('status')
        
        if new_status in ['online', 'busy', 'break', 'offline']:
            doctor_stats.status = new_status
            doctor_stats.save()
            
            return Response({
                'status': 'success',
                'message': f'상태가 {doctor_stats.get_status_display()}로 변경되었습니다.',
                'data': DoctorStatsSerializer(doctor_stats).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'error',
                'message': '유효하지 않은 상태값입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except DoctorStats.DoesNotExist:
        return Response({
            'status': 'error',
            'message': '의사 정보를 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"의사 상태 업데이트 오류: {str(e)}")
        return Response({
            'error': f'상태 업데이트 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """시스템 상태 확인"""
    try:
        return Response({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'message': '메인 페이지 기능이 정상 작동 중입니다.'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def alert_count(request):
    """긴급 알림 수 조회"""
    try:
        # 중요한 공지사항 수 계산 - Q 사용으로 수정
        urgent_notices = Notice.objects.filter(
            notice_type='important',
            is_active=True,
            start_date__lte=timezone.now()
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=timezone.now())
        ).count()
        
        total_alerts = urgent_notices
        
        return Response({
            'status': 'success',
            'data': {
                'total_alerts': total_alerts,
                'urgent_notices': urgent_notices
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"알림 수 조회 오류: {str(e)}")
        return Response({
            'error': f'알림 수 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)