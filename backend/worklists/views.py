from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, action
from datetime import datetime, date
from .models import StudyRequest
from .serializers import StudyRequestSerializer, WorklistSerializer
from django.db.models import Q, Count
from medical_integration.models import PatientMapping 

#영상 검사 요청
class StudyRequestViewSet(viewsets.ModelViewSet):
    queryset = StudyRequest.objects.all()
    serializer_class = StudyRequestSerializer
    
    def create(self, request, *args, **kwargs):
        print("받은 데이터:", request.data)  # 디버깅용
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"status": "success", "data": serializer.data}, 
                status=status.HTTP_201_CREATED
            )
        else:
            print("Serializer 에러:", serializer.errors)  # 디버깅용
            return Response(
                {"status": "error", "errors": serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # 🆕 React Dashboard용 워크리스트 API
    @action(detail=False, methods=['get'])
    def worklist(self, request):
        """React Dashboard에서 사용할 워크리스트 데이터"""
        try:
            # 최신순으로 정렬
            study_requests = StudyRequest.objects.all().order_by('-request_datetime')
            serializer = WorklistSerializer(study_requests, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # 🆕 검사 배정 API - 시간대 문제 해결
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """드래그앤드롭으로 검사 배정"""
        try:
            study_request = self.get_object()
            
            # 요청 데이터 추출
            room_id = request.data.get('roomId')
            radiologist_id = request.data.get('radiologistId')
            start_time = request.data.get('startTime')
            duration = request.data.get('duration')
            
            print(f"받은 시간 데이터: {start_time}")  # 디버깅용
            
            # 검증
            if not all([room_id, radiologist_id, start_time, duration]):
                return Response(
                    {'error': '필수 정보가 누락되었습니다.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 관련 객체 가져오기
            from schedules.models import ExamRoom
            from doctors.models import Doctor
            from datetime import datetime
            from django.utils import timezone
            import pytz
            
            room = ExamRoom.objects.get(room_id=room_id)
            radiologist = Doctor.objects.get(id=radiologist_id)
            
            # 🔥 시간 파싱 개선 - KST 시간대 명시적 처리
            if isinstance(start_time, str):
                # KST 시간대 설정
                kst = pytz.timezone('Asia/Seoul')
                
                if 'T' in start_time and ('+' in start_time or 'Z' in start_time):
                    # ISO 형식인 경우 (예: "2025-06-26T14:00:00+09:00")
                    start_datetime = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    if start_datetime.tzinfo is None:
                        start_datetime = kst.localize(start_datetime)
                else:
                    # 시간만 주어진 경우 (예: "14:00")
                    from datetime import date, time
                    today = date.today()
                    time_obj = datetime.strptime(start_time, '%H:%M').time()
                    naive_datetime = datetime.combine(today, time_obj)
                    # KST로 직접 localize (UTC 변환 방지)
                    start_datetime = kst.localize(naive_datetime)
            else:
                start_datetime = start_time
            
            print(f"파싱된 시간: {start_datetime}")  # 디버깅용
            
            # 배정 실행
            study_request.assign_schedule(room, radiologist, start_datetime, int(duration))
            
            # 업데이트된 데이터 반환
            serializer = WorklistSerializer(study_request)
            return Response(serializer.data)
            
        except ExamRoom.DoesNotExist:
            return Response(
                {'error': '검사실을 찾을 수 없습니다.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Doctor.DoesNotExist:
            return Response(
                {'error': '영상전문의를 찾을 수 없습니다.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"배정 에러: {e}")  # 디버깅용
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # 🆕 검사 시작 API
    @action(detail=True, methods=['post'])
    def start_exam(self, request, pk=None):
        """검사 시작"""
        try:
            study_request = self.get_object()
            
            if not study_request.can_start_exam():
                return Response(
                    {'error': '검사 시작이 불가능한 상태입니다.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            study_request.start_exam()
            serializer = WorklistSerializer(study_request)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # 🆕 검사 완료 API
    @action(detail=True, methods=['post'])
    def complete_exam(self, request, pk=None):
        """검사 완료"""
        try:
            study_request = self.get_object()
            
            if not study_request.can_complete_exam():
                return Response(
                    {'error': '검사 완료가 불가능한 상태입니다.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            study_request.complete_exam()
            serializer = WorklistSerializer(study_request)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # 🆕 검사 취소 API
    @action(detail=True, methods=['post'])
    def cancel_exam(self, request, pk=None):
        """검사 취소 (스케줄 삭제)"""
        try:
            study_request = self.get_object()
            study_request.cancel_schedule()
            serializer = WorklistSerializer(study_request)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# WorkList용 API (모든 필드 조회) - 기존 API 유지
@api_view(['GET'])
def work_list(request):
    """
    WorkList 페이지용 - 모든 StudyRequest 데이터를 모든 필드와 함께 반환
    """
    try:
        # created_at 대신 request_datetime으로 정렬 (실제 모델 필드 사용)
        study_requests = StudyRequest.objects.all().order_by('-request_datetime')
        
        # 실제 모델 필드에 맞게 데이터 구성
        work_list_data = []
        for request_obj in study_requests:
            data = {
                'id': request_obj.id,
                'patient_id': request_obj.patient_id,
                'patient_name': request_obj.patient_name,
                'birth_date': request_obj.birth_date.strftime('%Y-%m-%d') if request_obj.birth_date else None,
                'sex': request_obj.sex,
                'body_part': request_obj.body_part,
                'modality': request_obj.modality,
                'requesting_physician': request_obj.requesting_physician,
                'request_datetime': request_obj.request_datetime.strftime('%Y-%m-%d %H:%M:%S') if request_obj.request_datetime else None,
                'scheduled_exam_datetime': request_obj.scheduled_exam_datetime.strftime('%Y-%m-%d %H:%M:%S') if request_obj.scheduled_exam_datetime else None,
                'interpreting_physician': request_obj.interpreting_physician,
                'study_uid': request_obj.study_uid,
                'accession_number': request_obj.accession_number,
                'study_status': request_obj.study_status,
                'report_status': request_obj.report_status,
            }
            work_list_data.append(data)
        
        return Response({
            'status': 'success',
            'count': len(work_list_data),
            'data': work_list_data
        })
        
    except Exception as e:
        print(f"WorkList API 에러: {e}")
        return Response({
            'status': 'error',
            'message': '데이터를 불러오는데 실패했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 특정 StudyRequest 상세 조회 (WorkList에서 클릭시 사용) - 기존 API 유지
@api_view(['GET'])
def work_list_detail(request, pk):
    """
    특정 StudyRequest의 모든 상세 정보 반환
    """
    try:
        study_request = StudyRequest.objects.get(pk=pk)
        
        # 모든 필드 데이터 반환
        data = {
            'id': study_request.id,
            'patient_id': study_request.patient_id,
            'patient_name': study_request.patient_name,
            'birth_date': study_request.birth_date.strftime('%Y-%m-%d') if study_request.birth_date else None,
            'sex': study_request.sex,
            'body_part': study_request.body_part,
            'modality': study_request.modality,
            'requesting_physician': study_request.requesting_physician
            # 'created_at': study_request.created_at.strftime('%Y-%m-%d %H:%M:%S') if study_request.created_at else None,
            # 'updated_at': study_request.updated_at.strftime('%Y-%m-%d %H:%M:%S') if study_request.updated_at else None,
            # 실제 모델의 모든 필드 추가
        }
        
        return Response({
            'status': 'success',
            'data': data
        })
        
    except StudyRequest.DoesNotExist:
        return Response({
            'status': 'error',
            'message': '해당 요청을 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': '데이터를 불러오는데 실패했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def worklist_by_date(request, target_date):
    """
    ✅ React가 호출하는 날짜별 워크리스트 API
    URL: /api/worklists/2025-06-26/
    """
    try:
        print(f"📅 날짜별 워크리스트 요청: {target_date}")
        
        # 날짜 파싱
        try:
            target_date_obj = datetime.strptime(target_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'status': 'error',
                'message': '잘못된 날짜 형식입니다. YYYY-MM-DD 형식을 사용하세요.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ 해당 날짜의 요청들 필터링
        # request_datetime이 해당 날짜인 것들 + scheduled_exam_datetime이 해당 날짜인 것들
        from django.db.models import Q
        
        study_requests = StudyRequest.objects.filter(
            Q(request_datetime__date=target_date_obj) |  # 요청일이 해당 날짜
            Q(scheduled_exam_datetime__date=target_date_obj)  # 예정 검사일이 해당 날짜
        ).order_by('-request_datetime')
        
        print(f"📊 필터링된 데이터 개수: {study_requests.count()}")
        
        # 디버깅: 각 요청의 시간 정보 출력
        for req in study_requests[:3]:  # 처음 3개만
            print(f"ID: {req.id}, 요청일: {req.request_datetime}, 예정일: {req.scheduled_exam_datetime}")
        
        # ✅ WorklistSerializer 사용 (requestDateTime 포함)
        serializer = WorklistSerializer(study_requests, many=True)
        
        return Response({
            'status': 'success',
            'date': target_date,
            'count': len(serializer.data),
            'data': serializer.data
        })
        
    except Exception as e:
        print(f"❌ 날짜별 워크리스트 API 에러: {e}")
        return Response({
            'status': 'error',
            'message': f'데이터를 불러오는데 실패했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def worklist_by_date_specific(request, year, month, day):
    """
    ✅ 구체적인 날짜별 워크리스트 API (URL 충돌 방지)
    URL: /api/worklists/2025-06-26/
    """
    try:
        # 날짜 객체 생성
        target_date_obj = date(year, month, day)
        target_date = target_date_obj.strftime('%Y-%m-%d')
        
        print(f"📅 구체적 날짜별 워크리스트 요청: {target_date}")
        
        # ✅ 해당 날짜의 요청들 필터링
        from django.db.models import Q
        
        study_requests = StudyRequest.objects.filter(
            Q(request_datetime__date=target_date_obj) |  # 요청일이 해당 날짜
            Q(scheduled_exam_datetime__date=target_date_obj)  # 예정 검사일이 해당 날짜
        ).order_by('-request_datetime')
        
        print(f"📊 필터링된 데이터 개수: {study_requests.count()}")
        
        # 디버깅: 각 요청의 시간 정보 출력
        for req in study_requests[:3]:  # 처음 3개만
            print(f"ID: {req.id}, 요청일: {req.request_datetime}, 예정일: {req.scheduled_exam_datetime}")
        
        # ✅ WorklistSerializer 사용 (requestDateTime 포함)
        serializer = WorklistSerializer(study_requests, many=True)
        
        return Response({
            'status': 'success',
            'date': target_date,
            'count': len(serializer.data),
            'data': serializer.data
        })
        
    except ValueError as e:
        print(f"❌ 잘못된 날짜: {year}-{month}-{day}")
        return Response({
            'status': 'error',
            'message': f'잘못된 날짜입니다: {year}-{month}-{day}'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        print(f"❌ 구체적 날짜별 워크리스트 API 에러: {e}")
        return Response({
            'status': 'error',
            'message': f'데이터를 불러오는데 실패했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# backend/worklists/views.py의 completed_studies_list 함수에 디버깅 추가

# backend/worklists/views.py - 진료 완료된 환자 제외 버전

# backend/worklists/views.py - 진료 완료된 환자 제외 버전

@api_view(['GET'])
def completed_studies_list(request):
    """
    RealDicomViewer용 - 오늘 날짜에 진료실에 현재 배정되어 있으면서 검사상태가 완료된 검사 목록 반환
    ✅ 오늘 날짜 조건 추가
    ✅ 현재 진료실에 배정되어 있는 환자만 (과거 배정 이력 제외)
    ✅ 진료 완료된 환자 제외 (status='complete' 제외)
    ✅ DICOM 업로드 여부와 관계없이 검사상태만 완료되면 목록에 표시
    ✅ 리포트상태는 확인하지 않음
    ✅ 중복 PatientMapping 처리
    """
    try:
        print("=" * 50)
        print("🚀 completed_studies_list API 호출됨 (오늘 + 현재 진료실 배정 + 진료 미완료)")
        print(f"📡 요청 메서드: {request.method}")
        print(f"📡 요청 경로: {request.path}")
        print("=" * 50)
        
        # 🔥 오늘 날짜 계산
        from django.utils import timezone
        today = timezone.localdate()
        print(f"📅 오늘 날짜: {today}")
        
        # 검사완료 상태 정의
        study_completed_statuses = [
            '검사완료',     # 한국어 (worklists 앱)
            'completed',   # 영어 
            'COMPLETED',   # 대문자
            'Completed'    # 첫글자 대문자
        ]

        print(f"🔍 검색할 study 상태: {study_completed_statuses}")

        # 🆕 1단계: 오늘 날짜에 생성되고, 현재 진료실에 배정되어 있지만 진료가 완료되지 않은 환자들
        today_assigned_but_not_completed_mappings = PatientMapping.objects.filter(
            created_date__date=today,  # 🔥 오늘 날짜에 생성된 매핑만
            assigned_room__isnull=False,  # 🔥 진료실이 배정된 환자만 (null 제외)
            is_active=True,
            mapping_type='IDENTIFIER_BASED'
        ).exclude(
            status='complete'  # 🔥 진료 완료된 환자 제외
        ).values_list('patient_identifier', flat=True).distinct()  # 중복 제거

        assigned_patient_ids = list(today_assigned_but_not_completed_mappings)
        print(f"🏥 오늘 생성되고 진료실에 배정되었지만 진료 미완료 환자 수: {len(assigned_patient_ids)}명")
        print(f"🔍 배정된 환자 ID들: {assigned_patient_ids[:5]}{'...' if len(assigned_patient_ids) > 5 else ''}")

        # 🔥 디버깅: 전체 매핑 현황 확인
        total_today_mappings = PatientMapping.objects.filter(
            created_date__date=today,
            mapping_type='IDENTIFIER_BASED',
            is_active=True
        ).count()
        
        total_assigned_today = PatientMapping.objects.filter(
            created_date__date=today,
            assigned_room__isnull=False,
            mapping_type='IDENTIFIER_BASED',
            is_active=True
        ).count()
        
        completed_today = PatientMapping.objects.filter(
            created_date__date=today,
            assigned_room__isnull=False,
            mapping_type='IDENTIFIER_BASED',
            is_active=True,
            status='complete'
        ).count()
        
        print(f"📊 오늘 매핑 현황:")
        print(f"  - 전체 오늘 매핑: {total_today_mappings}개")
        print(f"  - 오늘 진료실 배정: {total_assigned_today}개")
        print(f"  - 오늘 진료 완료: {completed_today}개")
        print(f"  - 오늘 진료실 배정 + 진료 미완료: {len(assigned_patient_ids)}개")

        # 진료실 미배정 환자들 로그 확인 (오늘 날짜 기준)
        unassigned_patient_mappings = PatientMapping.objects.filter(
            created_date__date=today,  # 🔥 오늘 날짜 조건 추가
            assigned_room__isnull=True,  # 🔥 진료실이 배정되지 않은 환자들
            is_active=True,
            mapping_type='IDENTIFIER_BASED'
        ).values_list('patient_identifier', flat=True).distinct()
        
        unassigned_patient_ids = list(unassigned_patient_mappings)
        print(f"🚫 오늘 진료실 미배정 환자 수: {len(unassigned_patient_ids)}명 (제외됨)")
        print(f"🔍 미배정 환자 ID들: {unassigned_patient_ids[:5]}{'...' if len(unassigned_patient_ids) > 5 else ''}")

        # 완료된 환자들도 로그로 확인 (오늘 날짜 기준)
        completed_patient_mappings = PatientMapping.objects.filter(
            created_date__date=today,  # 🔥 오늘 날짜 조건 추가
            assigned_room__isnull=False,
            is_active=True,
            mapping_type='IDENTIFIER_BASED',
            status='complete'  # 진료 완료된 환자들
        ).values_list('patient_identifier', flat=True).distinct()
        
        completed_patient_ids = list(completed_patient_mappings)
        print(f"🏁 오늘 진료 완료된 환자 수: {len(completed_patient_ids)}명 (제외됨)")
        print(f"🔍 완료된 환자 ID들: {completed_patient_ids[:5]}{'...' if len(completed_patient_ids) > 5 else ''}")

        if not assigned_patient_ids:
            print("⚠️ 오늘 날짜에 진료실에 배정되었지만 진료가 완료되지 않은 환자가 없음")
            return Response({
                'status': 'success',
                'message': '오늘 날짜에 진료실에 배정되었지만 진료가 완료되지 않은 환자가 없습니다.',
                'count': 0,
                'data': [],
                'statistics': {
                    'total_completed': 0,
                    'with_dicom': 0,
                    'without_dicom': 0,
                    'assigned_patients': 0,
                    'excluded_completed_patients': len(completed_patient_ids),
                    'excluded_unassigned_patients': len(unassigned_patient_ids)
                }
            })

        # 전체 StudyRequest 개수 확인
        total_studies = StudyRequest.objects.count()
        print(f"📊 전체 StudyRequest 개수: {total_studies}")

        # 🆕 2단계: 오늘 날짜에 진료실에 배정되고 진료 미완료인 환자 중 검사상태가 완료된 항목만 조회
        completed_studies = StudyRequest.objects.filter(
            study_status__in=study_completed_statuses,
            patient_id__in=assigned_patient_ids  # 🔥 오늘 + 진료 미완료 + 진료실 배정 조건
        ).order_by('-request_datetime')

        completed_count = completed_studies.count()
        print(f"📊 오늘 진료실 배정 + 검사완료 + 진료미완료 상태인 검사 개수: {completed_count}")

        # 각 상태별 개수 확인 (디버깅용)
        for status_name in study_completed_statuses:
            count = StudyRequest.objects.filter(
                study_status=status_name,
                patient_id__in=assigned_patient_ids
            ).count()
            print(f"  - study_status='{status_name}' + 오늘 진료실 배정 + 진료미완료: {count}개")

        # study_uid 통계 (참고용)
        with_uid_count = completed_studies.exclude(
            Q(study_uid__isnull=True) | Q(study_uid__exact='')
        ).count()
        without_uid_count = completed_count - with_uid_count
        
        print(f"📊 진료실배정+검사완료+진료미완료 중 DICOM 있음: {with_uid_count}개")
        print(f"📊 진료실배정+검사완료+진료미완료 중 DICOM 없음: {without_uid_count}개")

        if completed_count == 0:
            print("⚠️ 진료실에 배정되었지만 진료 미완료 환자 중 검사완료된 항목이 없음")
            return Response({
                'status': 'success',
                'message': '진료실에 배정되었지만 진료가 완료되지 않은 환자 중 검사가 완료된 환자가 없습니다.',
                'count': 0,
                'data': [],
                'statistics': {
                    'total_completed': 0,
                    'with_dicom': 0,
                    'without_dicom': 0,
                    'assigned_patients': len(assigned_patient_ids),
                    'excluded_completed_patients': len(completed_patient_ids)
                }
            })

        # 🆕 3단계: 진료실 정보를 포함한 데이터 구성
        completed_data = []
        for study in completed_studies:
            # 🔥 해당 환자의 오늘 날짜 진료실 정보 가져오기 (중복 처리 + 진료 완료 상태 확인)
            try:
                # 🔥 오늘 생성된 가장 최근 매핑 정보 사용 (진료 완료되지 않은 것만)
                patient_mapping = PatientMapping.objects.filter(
                    patient_identifier=study.patient_id,
                    created_date__date=today,  # 🔥 오늘 날짜 조건 추가
                    is_active=True,
                    mapping_type='IDENTIFIER_BASED',
                    assigned_room__isnull=False  # 🔥 진료실이 배정된 것만 (null 제외)
                ).exclude(
                    status='complete'  # 🔥 진료 완료된 것 제외
                ).order_by('-last_sync').first()  # 가장 최근 업데이트된 것
                
                if patient_mapping and patient_mapping.assigned_room is not None:
                    assigned_room = patient_mapping.assigned_room
                    room_status = patient_mapping.status
                    
                    # 진료 완료 상태 체크 (이중 확인)
                    if room_status == 'complete':
                        print(f"⚠️ 환자 {study.patient_id}는 진료 완료 상태이므로 제외됨")
                        continue  # 이 환자는 건너뛰기
                        
                else:
                    # 🔥 오늘 날짜에 진료실이 배정되지 않았거나 매핑 정보가 없는 경우
                    print(f"🚫 환자 {study.patient_id}는 오늘 진료실이 배정되지 않았거나 매핑 정보가 없음 (제외)")
                    continue  # 이 환자는 건너뛰기
                    
            except Exception as e:
                print(f"❌ 환자 {study.patient_id} 매핑 조회 에러: {e}")
                continue  # 에러 발생 시 이 환자는 건너뛰기

            # study_uid가 없는 경우에도 목록에 포함 (임시 UID 생성)
            study_uid_display = study.study_uid if study.study_uid else f"temp_uid_{study.id}"
            
            print(f"  ✅ 오늘 진료 미완료 검사: {study.patient_name} - {study.modality} - 진료실: {assigned_room}번 - 상태: {room_status} - UID: {study_uid_display}")
            
            data = {
                'id': study.id,
                'patient_id': study.patient_id,
                'patient_name': study.patient_name,
                'birth_date': study.birth_date.strftime('%Y-%m-%d') if study.birth_date else None,
                'sex': study.sex,
                'modality': study.modality,
                'body_part': study.body_part,
                'study_uid': study_uid_display,
                'accession_number': study.accession_number,
                'requesting_physician': study.requesting_physician,
                'interpreting_physician': study.interpreting_physician,
                'request_datetime': study.request_datetime.strftime('%Y-%m-%d %H:%M:%S') if study.request_datetime else None,
                'scheduled_exam_datetime': study.scheduled_exam_datetime.strftime('%Y-%m-%d %H:%M:%S') if study.scheduled_exam_datetime else None,
                'study_status': study.study_status,
                'report_status': study.report_status,
                'completion_date': study.request_datetime.strftime('%Y-%m-%d') if study.request_datetime else None,
                # 🆕 진료실 정보 추가
                'assigned_room': assigned_room,
                'room_status': room_status,  # 'complete'가 아닌 상태만 포함됨
                # DICOM 이미지 존재 여부 플래그
                'has_dicom_images': bool(study.study_uid and study.study_uid.strip()),
            }
            completed_data.append(data)

        response_data = {
            'status': 'success',
            'count': len(completed_data),
            'message': f'오늘 날짜에 진료실에 배정되었지만 진료가 완료되지 않은 환자 중 {len(completed_data)}건의 완료된 검사를 찾았습니다. (DICOM 있음: {with_uid_count}건, 없음: {without_uid_count}건)',
            'data': completed_data,
            'statistics': {
                'total_completed': len(completed_data),  # 실제 반환된 데이터 개수
                'with_dicom': sum(1 for d in completed_data if d['has_dicom_images']),
                'without_dicom': sum(1 for d in completed_data if not d['has_dicom_images']),
                'assigned_patients': len(assigned_patient_ids),
                'excluded_completed_patients': len(completed_patient_ids),
                'excluded_unassigned_patients': len(unassigned_patient_ids)  # 🔥 제외된 진료실 미배정 환자 수
            }
        }
        
        print(f"✅ 최종 응답 데이터: {len(completed_data)}건 (오늘 진료 완료 {len(completed_patient_ids)}명, 오늘 진료실 미배정 {len(unassigned_patient_ids)}명 제외)")
        print("=" * 50)
        
        return Response(response_data)

    except Exception as e:
        print(f"❌ completed_studies_list 에러: {e}")
        print(f"❌ 에러 타입: {type(e)}")
        import traceback
        print(f"❌ 전체 스택트레이스:")
        traceback.print_exc()
        
        return Response({
            'status': 'error',
            'message': '완료된 검사 데이터를 불러오는데 실패했습니다.',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 🔥 completed_studies_by_patient 함수도 동일하게 수정
@api_view(['GET'])
def completed_studies_by_patient(request, patient_id):
    """
    특정 환자의 완료된 모든 study 목록 반환 (환자 내원이력용)
    ✅ 진료실 배정 조건 추가
    ✅ DICOM 업로드 여부와 관계없이 검사상태만 완료되면 목록에 표시
    ✅ 중복 PatientMapping 처리
    """
    try:
        # 🆕 1단계: 해당 환자가 진료실에 배정되어 있는지 확인 (중복 처리)
        try:
            # 가장 최근에 업데이트된 매핑 정보 사용
            patient_mapping = PatientMapping.objects.filter(
                patient_identifier=patient_id,
                assigned_room__isnull=False,  # 진료실이 배정된 환자만
                is_active=True,
                mapping_type='IDENTIFIER_BASED'
            ).order_by('-last_sync').first()  # 가장 최근 업데이트된 것
            
            if patient_mapping:
                print(f"🏥 환자 {patient_id}는 {patient_mapping.assigned_room}번 진료실에 배정됨")
            else:
                print(f"❌ 환자 {patient_id}는 진료실에 배정되지 않음")
                return Response({
                    'status': 'success',
                    'message': f'환자 {patient_id}가 진료실에 배정되지 않았습니다.',
                    'patient_id': patient_id,
                    'count': 0,
                    'data': []
                })
                
        except Exception as e:
            print(f"❌ 환자 {patient_id} 매핑 조회 에러: {e}")
            return Response({
                'status': 'error',
                'message': f'환자 {patient_id}의 매핑 정보 조회에 실패했습니다.',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        study_completed_statuses = [
            '검사완료', 'completed', 'COMPLETED', 'Completed'
        ]
        
        # 🆕 2단계: 진료실에 배정된 환자의 완료된 검사만 조회
        patient_studies = StudyRequest.objects.filter(
            patient_id=patient_id,
            study_status__in=study_completed_statuses
        ).order_by('-request_datetime')

        studies_data = []
        for study in patient_studies:
            # study_uid가 없는 경우에도 포함
            study_uid_display = study.study_uid if study.study_uid else f"temp_uid_{study.id}"
            
            data = {
                'id': study.id,
                'study_uid': study_uid_display,
                'accession_number': study.accession_number,
                'modality': study.modality,
                'body_part': study.body_part,
                'exam_date': study.request_datetime.strftime('%Y-%m-%d') if study.request_datetime else None,
                'exam_datetime': study.request_datetime.strftime('%Y-%m-%d %H:%M:%S') if study.request_datetime else None,
                'interpreting_physician': study.interpreting_physician,
                'requesting_physician': study.requesting_physician,
                'study_status': study.study_status,
                'report_status': study.report_status,
                'has_dicom_images': bool(study.study_uid and study.study_uid.strip()),
                # 🆕 진료실 정보 추가
                'assigned_room': patient_mapping.assigned_room,
                'room_status': patient_mapping.status,
            }
            studies_data.append(data)

        return Response({
            'status': 'success',
            'patient_id': patient_id,
            'assigned_room': patient_mapping.assigned_room,
            'room_status': patient_mapping.status,
            'count': len(studies_data),
            'data': studies_data
        })

    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'환자 {patient_id}의 검사 이력을 불러오는데 실패했습니다.',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def study_detail_for_viewer(request, study_uid):
    """
    DMViewer에서 특정 study 클릭시 필요한 모든 정보 반환
    (Orthanc DICOM 정보 + Django annotation 정보 + 리포트 정보)
    """
    try:
        # StudyRequest에서 기본 정보 조회
        study_request = StudyRequest.objects.get(study_uid=study_uid)
        
        # 기본 study 정보
        study_info = {
            'id': study_request.id,
            'patient_id': study_request.patient_id,
            'patient_name': study_request.patient_name,
            'birth_date': study_request.birth_date.strftime('%Y-%m-%d') if study_request.birth_date else None,
            'sex': study_request.sex,
            'study_uid': study_request.study_uid,
            'accession_number': study_request.accession_number,
            'modality': study_request.modality,
            'body_part': study_request.body_part,
            'exam_datetime': study_request.request_datetime.strftime('%Y-%m-%d %H:%M:%S') if study_request.request_datetime else None,
            'requesting_physician': study_request.requesting_physician,
            'interpreting_physician': study_request.interpreting_physician,
            'study_status': study_request.study_status,
            'report_status': study_request.report_status,
        }

        # TODO: 여기에 Orthanc에서 DICOM 이미지 정보 가져오는 로직 추가
        # orthanc_info = get_study_from_orthanc(study_uid)
        
        # TODO: 여기에 annotation 정보 가져오는 로직 추가 (dr_annotations 앱 활용)
        # annotations = get_annotations_for_study(study_uid)

        return Response({
            'status': 'success',
            'study_info': study_info,
            'has_images': bool(study_request.study_uid),  # study_uid가 있으면 이미지 존재
            'has_annotations': False,  # TODO: annotation 존재 여부 확인
            'has_report': study_request.report_status in ['작성완료', 'completed', 'COMPLETED', 'Completed'],
            # 'orthanc_info': orthanc_info,    # TODO: 구현 후 추가
            # 'annotations': annotations,       # TODO: 구현 후 추가
        })

    except StudyRequest.DoesNotExist:
        return Response({
            'status': 'error',
            'message': f'Study UID {study_uid}에 해당하는 검사를 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({
            'status': 'error',
            'message': '검사 상세 정보를 불러오는데 실패했습니다.',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# backend/worklists/views.py - 디버그용 함수 추가

@api_view(['GET'])
def debug_patient_mapping(request):
    """
    Patient ID 매칭 디버그용 API
    - StudyRequest의 patient_id 목록
    - PatientMapping의 patient_identifier 목록
    - PACS patient_id와 매칭 상태 확인
    """
    try:
        print("=" * 50)
        print("🔍 Patient ID 매칭 디버그 시작")
        print("=" * 50)
        
        # 1. StudyRequest의 patient_id 목록 확인
        study_patient_ids = StudyRequest.objects.values_list('patient_id', flat=True).distinct()
        study_patient_list = list(study_patient_ids)
        print(f"📋 StudyRequest patient_id 목록 ({len(study_patient_list)}개):")
        for i, pid in enumerate(study_patient_list[:10]):  # 처음 10개만
            print(f"  {i+1}. '{pid}' (길이: {len(pid) if pid else 0})")
        if len(study_patient_list) > 10:
            print(f"  ... 외 {len(study_patient_list)-10}개")
        
        # 2. PatientMapping의 patient_identifier 목록 확인
        mapping_patient_ids = PatientMapping.objects.filter(
            is_active=True,
            mapping_type='IDENTIFIER_BASED'
        ).values_list('patient_identifier', flat=True).distinct()
        mapping_patient_list = list(mapping_patient_ids)
        print(f"\n🏥 PatientMapping patient_identifier 목록 ({len(mapping_patient_list)}개):")
        for i, pid in enumerate(mapping_patient_list[:10]):  # 처음 10개만
            print(f"  {i+1}. '{pid}' (길이: {len(pid) if pid else 0})")
        if len(mapping_patient_list) > 10:
            print(f"  ... 외 {len(mapping_patient_list)-10}개")
        
        # 3. 진료실에 배정된 환자 확인
        assigned_mappings = PatientMapping.objects.filter(
            assigned_room__isnull=False,
            is_active=True,
            mapping_type='IDENTIFIER_BASED'
        )
        print(f"\n🏥 진료실 배정된 환자 ({assigned_mappings.count()}명):")
        for mapping in assigned_mappings[:5]:  # 처음 5명만
            print(f"  - {mapping.patient_identifier} ({mapping.display}) → {mapping.assigned_room}번실")
        
        # 4. 매칭되는 patient_id 확인
        matched_ids = []
        unmatched_study_ids = []
        unmatched_mapping_ids = []
        
        for study_id in study_patient_list:
            if study_id in mapping_patient_list:
                matched_ids.append(study_id)
            else:
                unmatched_study_ids.append(study_id)
        
        for mapping_id in mapping_patient_list:
            if mapping_id not in study_patient_list:
                unmatched_mapping_ids.append(mapping_id)
        
        print(f"\n🔗 매칭 결과:")
        print(f"  ✅ 매칭되는 ID: {len(matched_ids)}개")
        print(f"  ❌ StudyRequest에만 있는 ID: {len(unmatched_study_ids)}개")
        print(f"  ❌ PatientMapping에만 있는 ID: {len(unmatched_mapping_ids)}개")
        
        # 5. PACS 형식 ID 패턴 분석
        pacs_pattern_ids = [pid for pid in study_patient_list if pid and len(pid) == 4 and pid.startswith('P')]
        print(f"\n🎯 PACS 패턴 (P + 3자리) ID: {len(pacs_pattern_ids)}개")
        for pid in pacs_pattern_ids[:5]:
            print(f"  - {pid}")
        
        # 6. 검사완료 상태인 StudyRequest 중 진료실 매칭 확인
        completed_studies = StudyRequest.objects.filter(
            study_status__in=['검사완료', 'completed', 'COMPLETED', 'Completed']
        )
        
        completed_with_room = 0
        completed_without_room = 0
        
        for study in completed_studies:
            if study.patient_id in mapping_patient_list:
                # 해당 환자가 진료실에 배정되어 있는지 확인
                has_room = PatientMapping.objects.filter(
                    patient_identifier=study.patient_id,
                    assigned_room__isnull=False,
                    is_active=True,
                    mapping_type='IDENTIFIER_BASED'
                ).exists()
                
                if has_room:
                    completed_with_room += 1
                else:
                    completed_without_room += 1
        
        print(f"\n📊 검사완료 상태 분석:")
        print(f"  전체 검사완료: {completed_studies.count()}건")
        print(f"  진료실 배정 + 검사완료: {completed_with_room}건")
        print(f"  진료실 미배정 + 검사완료: {completed_without_room}건")
        
        # 응답 데이터 구성
        response_data = {
            'status': 'success',
            'debug_info': {
                'study_patient_ids': {
                    'count': len(study_patient_list),
                    'sample': study_patient_list[:10],
                    'pacs_pattern_count': len(pacs_pattern_ids),
                    'pacs_pattern_sample': pacs_pattern_ids[:5]
                },
                'mapping_patient_ids': {
                    'count': len(mapping_patient_list),
                    'sample': mapping_patient_list[:10]
                },
                'assigned_patients': {
                    'count': assigned_mappings.count(),
                    'sample': [
                        {
                            'patient_identifier': m.patient_identifier,
                            'display': m.display,
                            'assigned_room': m.assigned_room
                        } for m in assigned_mappings[:5]
                    ]
                },
                'matching_results': {
                    'matched_count': len(matched_ids),
                    'unmatched_study_count': len(unmatched_study_ids),
                    'unmatched_mapping_count': len(unmatched_mapping_ids),
                    'matched_sample': matched_ids[:5],
                    'unmatched_study_sample': unmatched_study_ids[:5],
                    'unmatched_mapping_sample': unmatched_mapping_ids[:5]
                },
                'completed_studies_analysis': {
                    'total_completed': completed_studies.count(),
                    'with_room_assignment': completed_with_room,
                    'without_room_assignment': completed_without_room
                }
            }
        }
        
        print("=" * 50)
        print("🔍 Patient ID 매칭 디버그 완료")
        print("=" * 50)
        
        return Response(response_data)
        
    except Exception as e:
        print(f"❌ 디버그 API 에러: {e}")
        import traceback
        traceback.print_exc()
        
        return Response({
            'status': 'error',
            'message': '디버그 정보 조회 실패',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# backend/worklists/views.py - PACS Patient ID 동기화 함수 추가

@api_view(['POST'])
def sync_pacs_patient_ids(request):
    """
    PACS Patient ID와 데이터베이스 동기화
    PACS에서 사용하는 P001, P002 형식의 patient_id를 기반으로 
    PatientMapping과 StudyRequest를 연결
    """
    try:
        print("=" * 50)
        print("🔄 PACS Patient ID 동기화 시작")
        print("=" * 50)
        
        # 1. PACS 패턴의 patient_id를 가진 StudyRequest 조회
        pacs_studies = StudyRequest.objects.filter(
            patient_id__regex=r'^P\d{3}$'  # P + 3자리 숫자 패턴
        )
        
        print(f"📋 PACS 패턴 StudyRequest: {pacs_studies.count()}건")
        
        created_mappings = 0
        updated_mappings = 0
        errors = []
        
        for study in pacs_studies:
            try:
                pacs_patient_id = study.patient_id
                
                # 2. 동일한 환자 이름으로 기존 PatientMapping 찾기
                potential_mappings = PatientMapping.objects.filter(
                    display__icontains=study.patient_name.split()[0] if study.patient_name else '',
                    is_active=True,
                    mapping_type='IDENTIFIER_BASED'
                )
                
                if potential_mappings.exists():
                    # 기존 매핑이 있으면 patient_identifier 업데이트
                    mapping = potential_mappings.first()
                    old_identifier = mapping.patient_identifier
                    mapping.patient_identifier = pacs_patient_id
                    mapping.save(update_fields=['patient_identifier'])
                    
                    print(f"✅ 매핑 업데이트: {old_identifier} → {pacs_patient_id} ({mapping.display})")
                    updated_mappings += 1
                    
                else:
                    # 새 매핑 생성 (최소한의 정보로)
                    mapping = PatientMapping.objects.create(
                        orthanc_patient_id=f"PACS_{pacs_patient_id}",
                        openmrs_patient_uuid=f"temp_uuid_{pacs_patient_id}",
                        patient_identifier=pacs_patient_id,
                        mapping_type='IDENTIFIER_BASED',
                        display=study.patient_name or f"환자_{pacs_patient_id}",
                        sync_status='MANUAL_SYNC',
                        is_active=True
                    )
                    
                    print(f"🆕 새 매핑 생성: {pacs_patient_id} ({mapping.display})")
                    created_mappings += 1
                    
            except Exception as e:
                error_msg = f"환자 {study.patient_id} 처리 실패: {str(e)}"
                errors.append(error_msg)
                print(f"❌ {error_msg}")
        
        # 3. 결과 요약
        print(f"\n📊 동기화 결과:")
        print(f"  🆕 새 매핑 생성: {created_mappings}개")
        print(f"  ✅ 기존 매핑 업데이트: {updated_mappings}개")
        print(f"  ❌ 에러: {len(errors)}개")
        
        return Response({
            'status': 'success',
            'message': f'PACS Patient ID 동기화 완료',
            'results': {
                'created_mappings': created_mappings,
                'updated_mappings': updated_mappings,
                'errors_count': len(errors),
                'errors': errors[:5]  # 처음 5개 에러만
            }
        })
        
    except Exception as e:
        print(f"❌ PACS 동기화 에러: {e}")
        import traceback
        traceback.print_exc()
        
        return Response({
            'status': 'error',
            'message': 'PACS Patient ID 동기화 실패',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 의사 profile 카드
@api_view(['GET'])
def doctor_dashboard_stats(request):
    """
    판독의별 대시보드 통계 API
    ProfileCard에서 사용할 실시간 통계 데이터 반환
    """
    try:
        # 요청 파라미터에서 판독의 이름 가져오기 (디폴트: 심보람)
        doctor_name = request.GET.get('doctor_name', '심보람')
        
        print(f"📊 판독의별 통계 요청: {doctor_name}")
        
        # 오늘 날짜
        today = date.today()
        
        # 해당 판독의의 오늘 검사 요청들 (interpreting_physician 기준)
        today_studies = StudyRequest.objects.filter(
            interpreting_physician=doctor_name,
            request_datetime__date=today
        )
        
        # 🔥 1. 금일 총 영상 검사 (오늘 요청된 모든 검사)
        today_total = today_studies.count()
        
        # 🔥 2. 검사 현황 (검사완료 / 전체 검사)
        exam_completed = today_studies.filter(
            study_status__in=['검사완료', 'completed', 'COMPLETED', 'Completed']
        ).count()
        
        exam_total = today_studies.count()  # 심보람의 오늘 전체 검사
        
        # 🔥 3. 레포트 현황 (레포트완료 / 전체 레포트)
        report_completed = today_studies.filter(
            report_status__in=['작성완료', 'completed', 'COMPLETED', 'Completed']
        ).count()
        
        report_total = today_studies.count()  # 심보람의 오늘 전체 레포트
        
        # 📊 디버깅 로그
        print(f"📈 {doctor_name} 통계:")
        print(f"  금일 총 검사: {today_total}")
        print(f"  검사완료: {exam_completed}, 검사전체: {exam_total}")
        print(f"  레포트완료: {report_completed}, 레포트전체: {report_total}")
        
        # 🎯 응답 데이터 구성
        response_data = {
            'status': 'success',
            'doctor_name': doctor_name,
            'date': today.strftime('%Y-%m-%d'),
            'stats': {
                'today_total': today_total,          # 금일 총 영상검사
                'exam_completed': exam_completed,    # 검사완료
                'exam_total': exam_total,            # 검사전체
                'report_completed': report_completed, # 레포트완료
                'report_total': report_total          # 레포트전체
            },
            'display': {
                'today_total_display': f"{today_total}",
                'exam_status_display': f"{exam_completed}/{exam_total}",      # "1/1" 형태
                'report_status_display': f"{report_completed}/{report_total}"  # "0/1" 형태
            }
        }
        
        return Response(response_data)
        
    except Exception as e:
        print(f"❌ 판독의 통계 API 에러: {e}")
        import traceback
        traceback.print_exc()
        
        return Response({
            'status': 'error',
            'message': '판독의 통계 데이터를 불러오는데 실패했습니다.',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# viewer2
@api_view(['GET'])
def patient_worklist(request, patient_id):
    """특정 환자의 WorkList 정보 반환"""
    try:
        study_request = StudyRequest.objects.filter(patient_id=patient_id).first()
        if study_request:
            # 환자 정보 + 검사 정보 반환
            return Response({
                'patient_id': study_request.patient_id,
                'patient_name': study_request.patient_name,
                'birth_date': study_request.birth_date,
                'sex': study_request.sex,
                'exam_datetime': study_request.request_datetime,
                'modality': study_request.modality,
                'body_part': study_request.body_part
            })
    except:
        return Response({'error': 'Patient not found'})