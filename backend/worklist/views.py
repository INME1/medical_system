from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import StudyRequest
from .serializers import StudyRequestSerializer


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