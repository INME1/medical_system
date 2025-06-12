# backend/worklist/views.py (create-from-emr 추가)

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import StudyRequest
from .serializers import StudyRequestSerializer
from datetime import datetime


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

# 🔥 NEW: EMR에서 호출하는 전용 엔드포인트
@api_view(['POST'])
@permission_classes([AllowAny])
def create_from_emr(request):
    """
    EMR ImagingRequestPanel에서 호출하는 전용 엔드포인트
    ImagingRequestPanel의 데이터 형식에 맞춰 처리
    """
    try:
        data = request.data
        print("🏥 EMR에서 받은 영상검사 요청:", data)
        
        # 🔥 FIX: UUID를 patient_id에 저장하되, 길이 제한 해결
        # 실제로는 UUID 전체를 저장할 수 있도록 patient_id 필드를 확장하거나
        # 별도 필드에 UUID를 저장하는 것이 좋지만, 일단 작동하도록 수정
        raw_patient_id = data.get('patient_id', '')
        
        # UUID 전체를 저장하기 위해 별도 처리 (임시 해결책)
        # 나중에 StudyRequest 모델에 openmrs_uuid 필드를 추가하는 것을 권장
        study_request_data = {
            # 필수 필드들
            'patient_id': raw_patient_id[:20],  # 모델 제한으로 일단 축약
            'patient_name': data.get('patient_name'),
            'birth_date': data.get('birth_date'),
            'sex': data.get('sex'),
            'modality': data.get('modality'),
            'body_part': data.get('body_part'),
            'requesting_physician': data.get('requesting_physician'),
            
            # 선택적 필드들
            'study_description': data.get('study_description', ''),
            'clinical_info': data.get('clinical_info', ''),
            'priority': data.get('priority', 'routine'),
            
            # 자동 생성 필드들
            'request_datetime': datetime.now(),
            'study_status': 'requested',
            'report_status': 'requested',
            
            # Accession Number에 전체 UUID 저장 (임시 해결책)
            'accession_number': f"EMR_{raw_patient_id}",  # 🔥 UUID 전체를 여기에 저장
            
            'study_uid': '',
        }
        
        # 🔥 중요: UUID 저장을 위한 임시 해결책
        # accession_number에 "EMR_" + UUID 형태로 저장하여 나중에 추출 가능
        
        # 날짜 형식 처리 (birth_date가 문자열인 경우)
        if isinstance(study_request_data['birth_date'], str):
            try:
                # YYYY-MM-DD 형식으로 가정
                study_request_data['birth_date'] = datetime.strptime(
                    study_request_data['birth_date'], '%Y-%m-%d'
                ).date()
            except ValueError:
                # 날짜 파싱 실패 시 None으로 설정
                study_request_data['birth_date'] = None
        
        print("🔄 변환된 StudyRequest 데이터:", study_request_data)
        print(f"📏 patient_id 길이: {len(study_request_data['patient_id'])}")
        print(f"📋 report_status: {study_request_data['report_status']}")
        print(f"📋 study_status: {study_request_data['study_status']}")
        
        # 시리얼라이저로 검증 및 저장
        serializer = StudyRequestSerializer(data=study_request_data)
        if serializer.is_valid():
            study_request = serializer.save()
            
            print(f"✅ StudyRequest 생성 성공: ID {study_request.id}")
            
            # ImagingRequestPanel이 기대하는 응답 형식으로 반환
            return Response({
                'success': True,
                'message': '영상검사 요청이 성공적으로 등록되었습니다.',
                'data': {
                    'id': study_request.id,
                    'patient_id': study_request.patient_id,
                    'patient_name': study_request.patient_name,
                    'modality': study_request.modality,
                    'body_part': study_request.body_part,
                    'accession_number': study_request.accession_number,
                    'status': study_request.study_status,
                    'created_at': study_request.request_datetime.isoformat() if study_request.request_datetime else None
                }
            }, status=status.HTTP_201_CREATED)
        else:
            print("❌ StudyRequest 검증 실패:", serializer.errors)
            return Response({
                'success': False,
                'error': 'StudyRequest 데이터 검증 실패',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"❌ create_from_emr 에러: {e}")
        return Response({
            'success': False,
            'error': '영상검사 요청 처리 중 오류가 발생했습니다.',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# WorkList용 API (모든 필드 조회)
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

# 특정 StudyRequest 상세 조회 (WorkList에서 클릭시 사용)
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