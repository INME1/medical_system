# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.shortcuts import get_object_or_404
# from django.db import transaction
# from .models import AnnotationResult
# from .serializers import (
#     AnnotationResultSerializer, 
#     AnnotationResultCreateSerializer,
#     AnnotationResultListSerializer
# )
# # 👈 AI 분석 결과 모델과 워크리스트 모델 import 추가
# from ai_analysis.models import AIAnalysisResult
# from worklists.models import StudyRequest

# class AnnotationSaveView(APIView):
#     """어노테이션 저장 API - React에서 호출하는 메인 API"""
    
#     def post(self, request):
#         try:
#             # 요청 데이터에서 study_uid만 받기 (AI 분석과 동일)
#             study_uid = request.data.get('study_uid')
#             annotations = request.data.get('annotations', [])
            
#             if not study_uid:
#                 return Response({
#                     'status': 'error',
#                     'message': 'study_uid가 필요합니다'
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             if not annotations:
#                 return Response({
#                     'status': 'error',
#                     'message': '최소 하나의 어노테이션이 필요합니다'
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             # 👈 이미 저장된 AI 분석 결과에서 환자 정보 가져오기
#             ai_result = AIAnalysisResult.objects.filter(study_uid=study_uid).first()
#             if not ai_result:
#                 return Response({
#                     'status': 'error',
#                     'message': f'Study UID {study_uid}에 해당하는 AI 분석 결과를 찾을 수 없습니다.'
#                 }, status=status.HTTP_404_NOT_FOUND)
            
#             patient_id = ai_result.patient_id
            
#             # 👈 환자ID로 worklist에서 배정된 판독의 조회
#             try:
#                 study_request = StudyRequest.objects.filter(patient_id=patient_id).first()
#                 if study_request and study_request.assigned_radiologist:
#                     # 실제 배정된 판독의 정보 사용
#                     radiologist = study_request.assigned_radiologist  # Doctor 모델 인스턴스
#                     doctor_name = radiologist.name  # 의사 이름
#                     doctor_id = radiologist.medical_id  # 👈 의료진식별번호 사용 (R0001 형태)
#                 else:
#                     # fallback: 기본값 사용 (배정되지 않은 경우)
#                     doctor_name = '미배정'
#                     doctor_id = 'UNASSIGNED'
#             except Exception as e:
#                 # 에러 발생 시 기본값 사용
#                 print(f"판독의 조회 중 에러: {e}")
#                 doctor_name = '김영상'  # 임시 fallback
#                 doctor_id = 'DR001'
            
#             # 트랜잭션으로 안전하게 처리
#             with transaction.atomic():
#                 # 기존 어노테이션 삭제 (새로 저장)
#                 deleted_count = AnnotationResult.objects.filter(study_uid=study_uid).delete()[0]
                
#                 # 새 어노테이션들 저장
#                 saved_annotations = []
#                 for ann_data in annotations:
#                     annotation = AnnotationResult.objects.create(
#                         study_uid=study_uid,
#                         patient_id=patient_id,  # 👈 AI 분석 결과에서 가져온 patient_id 사용
#                         series_uid=f"{study_uid}.1",  # 임시값
#                         instance_uid=f"{study_uid}.1.1",  # 임시값
#                         instance_number=1,  # 임시값
#                         label=ann_data['label'],
#                         bbox=ann_data['bbox'],
#                         dr_text=ann_data.get('dr_text', ''),
#                         # 👈 실제 판독의 정보 사용 (하드코딩 제거)
#                         doctor_id=doctor_id,
#                         doctor_name=doctor_name,
#                     )
#                     saved_annotations.append(annotation)
            
#             return Response({
#                 'status': 'success',
#                 'message': f'{len(saved_annotations)}개 어노테이션이 저장되었습니다',
#                 'data': {
#                     'study_uid': study_uid,
#                     'patient_id': patient_id,
#                     'doctor_name': doctor_name,  # 👈 실제 사용된 판독의 이름 반환
#                     'doctor_id': doctor_id,      # 👈 판독의 ID도 추가
#                     'saved_count': len(saved_annotations),
#                     'deleted_count': deleted_count,
#                     'annotations': [              # 👈 저장된 어노테이션 정보도 반환
#                         {
#                             'label': ann.label,
#                             'bbox': ann.bbox,
#                             'doctor_name': ann.doctor_name,
#                             'created': ann.created_at.isoformat()
#                         } for ann in saved_annotations
#                     ]
#                 }
#             }, status=status.HTTP_201_CREATED)
            
#         except Exception as e:
#             return Response({
#                 'status': 'error',
#                 'message': f'저장 실패: {str(e)}'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class AnnotationLoadView(APIView):
#     """어노테이션 불러오기 API - React에서 호출하는 메인 API"""
    
#     def get(self, request, study_uid):
#         try:
#             # 해당 study_uid의 모든 어노테이션 조회
#             annotations = AnnotationResult.objects.filter(study_uid=study_uid).order_by('-created_at')
            
#             if not annotations.exists():
#                 return Response({
#                     'status': 'success',
#                     'message': '저장된 어노테이션이 없습니다',
#                     'annotations': [],
#                     'count': 0
#                 }, status=status.HTTP_200_OK)
            
#             # React 코드에 맞는 형태로 데이터 포맷팅
#             annotation_data = []
#             for ann in annotations:
#                 annotation_data.append({
#                     'bbox': ann.bbox,
#                     'label': ann.label,
#                     'confidence': 1.0,  # 수동 어노테이션은 confidence 1.0
#                     'created': ann.created_at.isoformat(),
#                     'dr_text': ann.dr_text or '',
#                     'doctor_name': ann.doctor_name  # 👈 실제 판독의 이름 표시
#                 })
            
#             return Response({
#                 'status': 'success',
#                 'annotations': annotation_data,
#                 'count': len(annotation_data),
#                 'study_uid': study_uid,
#                 'patient_id': annotations.first().patient_id if annotations.exists() else None
#             }, status=status.HTTP_200_OK)
            
#         except Exception as e:
#             return Response({
#                 'status': 'error',
#                 'message': f'불러오기 실패: {str(e)}'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class AnnotationDetailView(APIView):
#     """개별 어노테이션 조회/수정/삭제"""
    
#     def get(self, request, annotation_id):
#         """개별 어노테이션 조회"""
#         try:
#             annotation = get_object_or_404(AnnotationResult, id=annotation_id)
#             serializer = AnnotationResultSerializer(annotation)
#             return Response({
#                 'status': 'success',
#                 'annotation': serializer.data
#             }, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response({
#                 'status': 'error',
#                 'message': f'조회 실패: {str(e)}'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
#     def put(self, request, annotation_id):
#         """개별 어노테이션 수정"""
#         try:
#             annotation = get_object_or_404(AnnotationResult, id=annotation_id)
#             serializer = AnnotationResultSerializer(annotation, data=request.data, partial=True)
            
#             if serializer.is_valid():
#                 serializer.save()
#                 return Response({
#                     'status': 'success',
#                     'message': '어노테이션이 수정되었습니다',
#                     'annotation': serializer.data
#                 }, status=status.HTTP_200_OK)
#             else:
#                 return Response({
#                     'status': 'error',
#                     'message': '데이터 검증 실패',
#                     'errors': serializer.errors
#                 }, status=status.HTTP_400_BAD_REQUEST)
                
#         except Exception as e:
#             return Response({
#                 'status': 'error',
#                 'message': f'수정 실패: {str(e)}'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
#     def delete(self, request, annotation_id):
#         """개별 어노테이션 삭제"""
#         try:
#             annotation = get_object_or_404(AnnotationResult, id=annotation_id)
#             study_uid = annotation.study_uid
#             annotation.delete()
            
#             return Response({
#                 'status': 'success',
#                 'message': '어노테이션이 삭제되었습니다',
#                 'study_uid': study_uid
#             }, status=status.HTTP_200_OK)
            
#         except Exception as e:
#             return Response({
#                 'status': 'error',
#                 'message': f'삭제 실패: {str(e)}'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class AnnotationListView(APIView):
#     """전체 어노테이션 목록 조회 (관리용)"""
    
#     def get(self, request):
#         try:
#             # 쿼리 파라미터로 필터링
#             queryset = AnnotationResult.objects.all()
            
#             # study_uid 필터
#             study_uid = request.GET.get('study_uid')
#             if study_uid:
#                 queryset = queryset.filter(study_uid=study_uid)
            
#             # patient_id 필터
#             patient_id = request.GET.get('patient_id')
#             if patient_id:
#                 queryset = queryset.filter(patient_id=patient_id)
            
#             # label 필터
#             label = request.GET.get('label')
#             if label:
#                 queryset = queryset.filter(label__icontains=label)
            
#             # 정렬
#             queryset = queryset.order_by('-created_at')
            
#             # 페이지네이션 (간단한 형태)
#             page_size = int(request.GET.get('page_size', 20))
#             page = int(request.GET.get('page', 1))
#             start = (page - 1) * page_size
#             end = start + page_size
            
#             total_count = queryset.count()
#             annotations = queryset[start:end]
            
#             serializer = AnnotationResultListSerializer(annotations, many=True)
            
#             return Response({
#                 'status': 'success',
#                 'annotations': serializer.data,
#                 'pagination': {
#                     'total_count': total_count,
#                     'page': page,
#                     'page_size': page_size,
#                     'total_pages': (total_count + page_size - 1) // page_size
#                 }
#             }, status=status.HTTP_200_OK)
            
#         except Exception as e:
#             return Response({
#                 'status': 'error',
#                 'message': f'목록 조회 실패: {str(e)}'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class AnnotationDeleteAllView(APIView):
#     """특정 study_uid의 모든 어노테이션 삭제"""
    
#     def delete(self, request, study_uid):
#         try:
#             deleted_result = AnnotationResult.objects.filter(study_uid=study_uid).delete()
#             deleted_count = deleted_result[0]
            
#             return Response({
#                 'status': 'success',
#                 'message': f'{deleted_count}개 어노테이션이 삭제되었습니다',
#                 'study_uid': study_uid,
#                 'deleted_count': deleted_count
#             }, status=status.HTTP_200_OK)
            
#         except Exception as e:
#             return Response({
#                 'status': 'error',
#                 'message': f'삭제 실패: {str(e)}'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# # backend/dr_annotations/views.py - 어노테이션 조회 API 추가

# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework import status
# from django.db import transaction
# from .models import AnnotationResult
# import json
# import logging

# logger = logging.getLogger(__name__)

# @api_view(['POST'])
# def get_annotations_by_instances(request):
#     """
#     여러 instance UID에 대한 어노테이션 조회
#     RealDicomViewer에서 사용
#     """
#     try:
#         instance_uids = request.data.get('instance_uids', [])
#         if not instance_uids:
#             return Response({
#                 'error': 'instance_uids가 필요합니다.'
#             }, status=status.HTTP_400_BAD_REQUEST)

#         print(f"🏷️ 어노테이션 조회 요청: {len(instance_uids)}개 instance")

#         # instance_uid로 어노테이션 조회
#         annotations = AnnotationResult.objects.filter(
#             instance_uid__in=instance_uids
#         ).order_by('-created_at')

#         print(f"✅ 조회된 어노테이션: {annotations.count()}개")

#         # 응답 데이터 구성
#         result = []
#         for annotation in annotations:
#             try:
#                 # bbox 데이터 파싱 (JSON 필드)
#                 bbox_data = annotation.bbox
#                 if isinstance(bbox_data, str):
#                     bbox_data = json.loads(bbox_data)

#                 result.append({
#                     'id': annotation.id,
#                     'patient_id': annotation.patient_id,
#                     'study_uid': annotation.study_uid,
#                     'series_uid': annotation.series_uid,
#                     'instance_uid': annotation.instance_uid,
#                     'instance_number': annotation.instance_number,
#                     'doctor_id': annotation.doctor_id,
#                     'doctor_name': annotation.doctor_name,
#                     'label': annotation.label,
#                     'bbox': bbox_data,
#                     'dr_text': annotation.dr_text,
#                     'created_at': annotation.created_at.isoformat(),
#                     'updated_at': annotation.updated_at.isoformat()
#                 })
#             except Exception as e:
#                 logger.error(f"어노테이션 {annotation.id} 파싱 오류: {e}")
#                 continue

#         return Response(result, status=status.HTTP_200_OK)

#     except Exception as e:
#         logger.error(f"어노테이션 조회 실패: {e}")
#         return Response({
#             'error': f'어노테이션 조회 중 오류 발생: {str(e)}'
#         }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# @api_view(['GET'])
# def get_annotations_by_study(request, study_uid):
#     """
#     특정 Study UID에 대한 모든 어노테이션 조회
#     """
#     try:
#         print(f"🏷️ Study UID로 어노테이션 조회: {study_uid}")

#         annotations = AnnotationResult.objects.filter(
#             study_uid=study_uid
#         ).order_by('-created_at')

#         print(f"✅ 조회된 어노테이션: {annotations.count()}개")

#         result = []
#         for annotation in annotations:
#             try:
#                 bbox_data = annotation.bbox
#                 if isinstance(bbox_data, str):
#                     bbox_data = json.loads(bbox_data)

#                 result.append({
#                     'id': annotation.id,
#                     'patient_id': annotation.patient_id,
#                     'study_uid': annotation.study_uid,
#                     'series_uid': annotation.series_uid,
#                     'instance_uid': annotation.instance_uid,
#                     'instance_number': annotation.instance_number,
#                     'doctor_id': annotation.doctor_id,
#                     'doctor_name': annotation.doctor_name,
#                     'label': annotation.label,
#                     'bbox': bbox_data,
#                     'dr_text': annotation.dr_text,
#                     'created_at': annotation.created_at.isoformat(),
#                     'updated_at': annotation.updated_at.isoformat()
#                 })
#             except Exception as e:
#                 logger.error(f"어노테이션 {annotation.id} 파싱 오류: {e}")
#                 continue

#         return Response(result, status=status.HTTP_200_OK)

#     except Exception as e:
#         logger.error(f"Study 어노테이션 조회 실패: {e}")
#         return Response({
#             'error': f'Study 어노테이션 조회 중 오류 발생: {str(e)}'
#         }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# @api_view(['POST'])
# def save_annotation(request):
#     """
#     새로운 어노테이션 저장
#     """
#     try:
#         data = request.data
        
#         # 필수 필드 검증
#         required_fields = ['patient_id', 'study_uid', 'instance_uid', 'label', 'bbox', 'doctor_id', 'doctor_name']
#         for field in required_fields:
#             if field not in data:
#                 return Response({
#                     'error': f'{field}가 필요합니다.'
#                 }, status=status.HTTP_400_BAD_REQUEST)

#         # 어노테이션 생성
#         annotation = AnnotationResult.objects.create(
#             patient_id=data['patient_id'],
#             study_uid=data['study_uid'],
#             series_uid=data.get('series_uid'),
#             instance_uid=data['instance_uid'],
#             instance_number=data.get('instance_number'),
#             doctor_id=data['doctor_id'],
#             doctor_name=data['doctor_name'],
#             label=data['label'],
#             bbox=data['bbox'],  # JSONField이므로 자동으로 직렬화됨
#             dr_text=data.get('dr_text', '')
#         )

#         print(f"✅ 어노테이션 저장 완료: ID {annotation.id}")

#         return Response({
#             'success': True,
#             'annotation_id': annotation.id,
#             'message': '어노테이션이 성공적으로 저장되었습니다.'
#         }, status=status.HTTP_201_CREATED)

#     except Exception as e:
#         logger.error(f"어노테이션 저장 실패: {e}")
#         return Response({
#             'error': f'어노테이션 저장 중 오류 발생: {str(e)}'
#         }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# @api_view(['DELETE'])
# def delete_annotation(request, annotation_id):
#     """
#     어노테이션 삭제
#     """
#     try:
#         annotation = AnnotationResult.objects.get(id=annotation_id)
#         annotation.delete()
        
#         print(f"✅ 어노테이션 삭제 완료: ID {annotation_id}")
        
#         return Response({
#             'success': True,
#             'message': '어노테이션이 성공적으로 삭제되었습니다.'
#         }, status=status.HTTP_200_OK)

#     except AnnotationResult.DoesNotExist:
#         return Response({
#             'error': '어노테이션을 찾을 수 없습니다.'
#         }, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         logger.error(f"어노테이션 삭제 실패: {e}")
#         return Response({
#             'error': f'어노테이션 삭제 중 오류 발생: {str(e)}'
#         }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import AnnotationResult
from .serializers import (
    AnnotationResultSerializer, 
    AnnotationResultCreateSerializer,
    AnnotationResultListSerializer,
    AnnotationResultDetailSerializer
)
# AI 분석 결과 모델과 워크리스트 모델 import
from ai_analysis.models import AIAnalysisResult
from worklists.models import StudyRequest

class AnnotationSaveView(APIView):
    """어노테이션 저장 API - 인스턴스 단위로 저장"""
    
    def post(self, request):
        try:
            # 인스턴스 단위 요청 데이터
            study_uid = request.data.get('study_uid')
            instance_uid = request.data.get('instance_uid')
            instance_number = request.data.get('instance_number')
            annotations = request.data.get('annotations', [])
            
            if not study_uid:
                return Response({
                    'status': 'error',
                    'message': 'study_uid가 필요합니다'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not instance_uid:
                return Response({
                    'status': 'error',
                    'message': 'instance_uid가 필요합니다'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not annotations:
                return Response({
                    'status': 'error',
                    'message': '최소 하나의 어노테이션이 필요합니다'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # AI 분석 결과에서 환자 정보 가져오기
            ai_result = AIAnalysisResult.objects.filter(study_uid=study_uid).first()
            if not ai_result:
                return Response({
                    'status': 'error',
                    'message': f'Study UID {study_uid}에 해당하는 AI 분석 결과를 찾을 수 없습니다.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            patient_id = ai_result.patient_id
            
            # 환자ID로 worklist에서 배정된 판독의 조회
            try:
                study_request = StudyRequest.objects.filter(patient_id=patient_id).first()
                if study_request and study_request.assigned_radiologist:
                    radiologist = study_request.assigned_radiologist
                    doctor_name = radiologist.name
                    doctor_id = radiologist.medical_id
                else:
                    doctor_name = '미배정'
                    doctor_id = 'UNASSIGNED'
            except Exception as e:
                print(f"판독의 조회 중 에러: {e}")
                doctor_name = '김영상'
                doctor_id = 'DR001'
            
            # 트랜잭션으로 안전하게 처리
            with transaction.atomic():
                # 해당 인스턴스의 기존 어노테이션 삭제 (인스턴스 단위)
                deleted_count = AnnotationResult.objects.filter(
                    study_uid=study_uid,
                    instance_uid=instance_uid
                ).delete()[0]
                
                # 새 어노테이션들 저장
                saved_annotations = []
                for ann_data in annotations:
                    # 필수 필드 검증
                    if 'shape_type' not in ann_data or 'coordinates' not in ann_data or 'label' not in ann_data:
                        return Response({
                            'status': 'error',
                            'message': '어노테이션에 shape_type, coordinates, label이 필요합니다.'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    annotation = AnnotationResult.objects.create(
                        study_uid=study_uid,
                        patient_id=patient_id,
                        series_uid=f"{study_uid}.1",  # 임시값
                        instance_uid=instance_uid,  # 실제 인스턴스 UID
                        instance_number=instance_number or 1,  # 실제 인스턴스 번호
                        label=ann_data['label'],
                        shape_type=ann_data['shape_type'],
                        coordinates=ann_data['coordinates'],
                        dr_text=ann_data.get('dr_text', ''),
                        doctor_id=doctor_id,
                        doctor_name=doctor_name,
                    )
                    saved_annotations.append(annotation)
            
            return Response({
                'status': 'success',
                'message': f'인스턴스 {instance_uid}에 {len(saved_annotations)}개 어노테이션이 저장되었습니다',
                'data': {
                    'study_uid': study_uid,
                    'instance_uid': instance_uid,
                    'instance_number': instance_number,
                    'patient_id': patient_id,
                    'doctor_name': doctor_name,
                    'doctor_id': doctor_id,
                    'saved_count': len(saved_annotations),
                    'deleted_count': deleted_count,
                    'annotations': [
                        {
                            'id': ann.id,
                            'label': ann.label,
                            'shape_type': ann.shape_type,
                            'coordinates': ann.coordinates,
                            'doctor_name': ann.doctor_name,
                            'created': ann.created_at.isoformat()
                        } for ann in saved_annotations
                    ]
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'저장 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AnnotationLoadView(APIView):
    """어노테이션 불러오기 API - 인스턴스 단위로 조회"""
    
    def get(self, request, study_uid):
        try:
            # 쿼리 파라미터에서 instance_uid 가져오기
            instance_uid = request.GET.get('instance_uid')
            
            # 기본 쿼리셋 (study_uid 기준)
            queryset = AnnotationResult.objects.filter(study_uid=study_uid)
            
            # instance_uid가 있으면 해당 인스턴스만 필터링
            if instance_uid:
                queryset = queryset.filter(instance_uid=instance_uid)
                message_suffix = f" (인스턴스: {instance_uid})"
            else:
                message_suffix = " (전체 Study)"
            
            annotations = queryset.order_by('-created_at')
            
            if not annotations.exists():
                return Response({
                    'status': 'success',
                    'message': f'저장된 어노테이션이 없습니다{message_suffix}',
                    'annotations': [],
                    'count': 0,
                    'study_uid': study_uid,
                    'instance_uid': instance_uid
                }, status=status.HTTP_200_OK)
            
            # React 코드에 맞는 형태로 데이터 포맷팅
            annotation_data = []
            for ann in annotations:
                annotation_data.append({
                    'id': ann.id,
                    'label': ann.label,
                    'shape_type': ann.shape_type,
                    'coordinates': ann.coordinates,
                    'confidence': 1.0,  # 수동 어노테이션은 confidence 1.0
                    'created': ann.created_at.isoformat(),
                    'dr_text': ann.dr_text or '',
                    'doctor_name': ann.doctor_name,
                    'instance_uid': ann.instance_uid,
                    'instance_number': ann.instance_number
                })
            
            return Response({
                'status': 'success',
                'annotations': annotation_data,
                'count': len(annotation_data),
                'study_uid': study_uid,
                'instance_uid': instance_uid,
                'patient_id': annotations.first().patient_id if annotations.exists() else None
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'불러오기 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AnnotationDetailView(APIView):
    """개별 어노테이션 조회/수정/삭제"""
    
    def get(self, request, annotation_id):
        """개별 어노테이션 조회 (면적/길이 계산 포함)"""
        try:
            annotation = get_object_or_404(AnnotationResult, id=annotation_id)
            serializer = AnnotationResultDetailSerializer(annotation)
            return Response({
                'status': 'success',
                'annotation': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'조회 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, annotation_id):
        """개별 어노테이션 수정"""
        try:
            annotation = get_object_or_404(AnnotationResult, id=annotation_id)
            serializer = AnnotationResultSerializer(annotation, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'status': 'success',
                    'message': '어노테이션이 수정되었습니다',
                    'annotation': serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'status': 'error',
                    'message': '데이터 검증 실패',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'수정 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, annotation_id):
        """개별 어노테이션 삭제"""
        try:
            annotation = get_object_or_404(AnnotationResult, id=annotation_id)
            study_uid = annotation.study_uid
            annotation.delete()
            
            return Response({
                'status': 'success',
                'message': '어노테이션이 삭제되었습니다',
                'study_uid': study_uid
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'삭제 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AnnotationListView(APIView):
    """전체 어노테이션 목록 조회 (관리용)"""
    
    def get(self, request):
        try:
            # 쿼리 파라미터로 필터링
            queryset = AnnotationResult.objects.all()
            
            # study_uid 필터
            study_uid = request.GET.get('study_uid')
            if study_uid:
                queryset = queryset.filter(study_uid=study_uid)
            
            # patient_id 필터
            patient_id = request.GET.get('patient_id')
            if patient_id:
                queryset = queryset.filter(patient_id=patient_id)
            
            # label 필터
            label = request.GET.get('label')
            if label:
                queryset = queryset.filter(label__icontains=label)
            
            # shape_type 필터 (새로 추가)
            shape_type = request.GET.get('shape_type')
            if shape_type:
                queryset = queryset.filter(shape_type=shape_type)
            
            # 정렬
            queryset = queryset.order_by('-created_at')
            
            # 페이지네이션 (간단한 형태)
            page_size = int(request.GET.get('page_size', 20))
            page = int(request.GET.get('page', 1))
            start = (page - 1) * page_size
            end = start + page_size
            
            total_count = queryset.count()
            annotations = queryset[start:end]
            
            serializer = AnnotationResultListSerializer(annotations, many=True)
            
            return Response({
                'status': 'success',
                'annotations': serializer.data,
                'pagination': {
                    'total_count': total_count,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': (total_count + page_size - 1) // page_size
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'목록 조회 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AnnotationDeleteAllView(APIView):
    """특정 study_uid 또는 인스턴스의 모든 어노테이션 삭제"""
    
    def delete(self, request, study_uid):
        try:
            # 쿼리 파라미터에서 instance_uid 가져오기
            instance_uid = request.GET.get('instance_uid')
            
            # 기본 쿼리셋 (study_uid 기준)
            queryset = AnnotationResult.objects.filter(study_uid=study_uid)
            
            # instance_uid가 있으면 해당 인스턴스만 필터링
            if instance_uid:
                queryset = queryset.filter(instance_uid=instance_uid)
                message_suffix = f" (인스턴스: {instance_uid})"
            else:
                message_suffix = " (전체 Study)"
            
            deleted_result = queryset.delete()
            deleted_count = deleted_result[0]
            
            return Response({
                'status': 'success',
                'message': f'{deleted_count}개 어노테이션이 삭제되었습니다{message_suffix}',
                'study_uid': study_uid,
                'instance_uid': instance_uid,
                'deleted_count': deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'삭제 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# backend/dr_annotations/views.py - 어노테이션 조회 API 추가

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import AnnotationResult
import json
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def get_annotations_by_instances(request):
    """
    여러 instance UID에 대한 어노테이션 조회
    RealDicomViewer에서 사용
    """
    try:
        instance_uids = request.data.get('instance_uids', [])
        if not instance_uids:
            return Response({
                'error': 'instance_uids가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)

        print(f"🏷️ 어노테이션 조회 요청: {len(instance_uids)}개 instance")

        # instance_uid로 어노테이션 조회
        annotations = AnnotationResult.objects.filter(
            instance_uid__in=instance_uids
        ).order_by('-created_at')

        print(f"✅ 조회된 어노테이션: {annotations.count()}개")

        # 응답 데이터 구성
        result = []
        for annotation in annotations:
            try:
                # coordinates 데이터 파싱 (JSON 필드)
                coordinates_data = annotation.coordinates
                if isinstance(coordinates_data, str):
                    coordinates_data = json.loads(coordinates_data)

                result.append({
                    'id': annotation.id,
                    'patient_id': annotation.patient_id,
                    'study_uid': annotation.study_uid,
                    'series_uid': annotation.series_uid,
                    'instance_uid': annotation.instance_uid,
                    'instance_number': annotation.instance_number,
                    'doctor_id': annotation.doctor_id,
                    'doctor_name': annotation.doctor_name,
                    'label': annotation.label,
                    'shape_type': annotation.shape_type,
                    'coordinates': coordinates_data,
                    'dr_text': annotation.dr_text,
                    'created_at': annotation.created_at.isoformat(),
                    'updated_at': annotation.updated_at.isoformat()
                })
            except Exception as e:
                logger.error(f"어노테이션 {annotation.id} 파싱 오류: {e}")
                continue

        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"어노테이션 조회 실패: {e}")
        return Response({
            'error': f'어노테이션 조회 중 오류 발생: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_annotations_by_study(request, study_uid):
    """
    특정 Study UID에 대한 모든 어노테이션 조회
    """
    try:
        print(f"🏷️ Study UID로 어노테이션 조회: {study_uid}")

        annotations = AnnotationResult.objects.filter(
            study_uid=study_uid
        ).order_by('-created_at')

        print(f"✅ 조회된 어노테이션: {annotations.count()}개")

        result = []
        for annotation in annotations:
            try:
                coordinates_data = annotation.coordinates
                if isinstance(coordinates_data, str):
                    coordinates_data = json.loads(coordinates_data)

                result.append({
                    'id': annotation.id,
                    'patient_id': annotation.patient_id,
                    'study_uid': annotation.study_uid,
                    'series_uid': annotation.series_uid,
                    'instance_uid': annotation.instance_uid,
                    'instance_number': annotation.instance_number,
                    'doctor_id': annotation.doctor_id,
                    'doctor_name': annotation.doctor_name,
                    'label': annotation.label,
                    'shape_type': annotation.shape_type,
                    'coordinates': coordinates_data,
                    'dr_text': annotation.dr_text,
                    'created_at': annotation.created_at.isoformat(),
                    'updated_at': annotation.updated_at.isoformat()
                })
            except Exception as e:
                logger.error(f"어노테이션 {annotation.id} 파싱 오류: {e}")
                continue

        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Study 어노테이션 조회 실패: {e}")
        return Response({
            'error': f'Study 어노테이션 조회 중 오류 발생: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def save_annotation(request):
    """
    새로운 어노테이션 저장
    """
    try:
        data = request.data
        
        # 필수 필드 검증
        required_fields = ['patient_id', 'study_uid', 'instance_uid', 'label', 'shape_type', 'coordinates', 'doctor_id', 'doctor_name']
        for field in required_fields:
            if field not in data:
                return Response({
                    'error': f'{field}가 필요합니다.'
                }, status=status.HTTP_400_BAD_REQUEST)

        # 어노테이션 생성
        annotation = AnnotationResult.objects.create(
            patient_id=data['patient_id'],
            study_uid=data['study_uid'],
            series_uid=data.get('series_uid'),
            instance_uid=data['instance_uid'],
            instance_number=data.get('instance_number'),
            doctor_id=data['doctor_id'],
            doctor_name=data['doctor_name'],
            label=data['label'],
            shape_type=data['shape_type'],
            coordinates=data['coordinates'],  # JSONField이므로 자동으로 직렬화됨
            dr_text=data.get('dr_text', '')
        )

        print(f"✅ 어노테이션 저장 완료: ID {annotation.id}")

        return Response({
            'success': True,
            'annotation_id': annotation.id,
            'message': '어노테이션이 성공적으로 저장되었습니다.'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"어노테이션 저장 실패: {e}")
        return Response({
            'error': f'어노테이션 저장 중 오류 발생: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def delete_annotation(request, annotation_id):
    """
    어노테이션 삭제
    """
    try:
        annotation = AnnotationResult.objects.get(id=annotation_id)
        annotation.delete()
        
        print(f"✅ 어노테이션 삭제 완료: ID {annotation_id}")
        
        return Response({
            'success': True,
            'message': '어노테이션이 성공적으로 삭제되었습니다.'
        }, status=status.HTTP_200_OK)

    except AnnotationResult.DoesNotExist:
        return Response({
            'error': '어노테이션을 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"어노테이션 삭제 실패: {e}")
        return Response({
            'error': f'어노테이션 삭제 중 오류 발생: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 통계 API 추가
class AnnotationStatsView(APIView):
    """어노테이션 통계 조회"""
    
    def get(self, request):
        try:
            from django.db.models import Count, Q
            from django.utils import timezone
            from datetime import timedelta
            
            # 전체 통계
            total_count = AnnotationResult.objects.count()
            
            # 도형별 통계
            shape_stats = AnnotationResult.objects.values('shape_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # 판독의별 통계
            doctor_stats = AnnotationResult.objects.values('doctor_name', 'doctor_id').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
            
            # 최근 7일 통계
            week_ago = timezone.now() - timedelta(days=7)
            recent_count = AnnotationResult.objects.filter(
                created_at__gte=week_ago
            ).count()
            
            # 라벨별 통계
            label_stats = AnnotationResult.objects.values('label').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
            
            return Response({
                'status': 'success',
                'stats': {
                    'total_count': total_count,
                    'recent_count': recent_count,
                    'shape_stats': list(shape_stats),
                    'doctor_stats': list(doctor_stats),
                    'label_stats': list(label_stats)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'통계 조회 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    """어노테이션 통계 조회"""
    
    def get(self, request):
        try:
            from django.db.models import Count, Q
            from django.utils import timezone
            from datetime import timedelta
            
            # 전체 통계
            total_count = AnnotationResult.objects.count()
            
            # 도형별 통계
            shape_stats = AnnotationResult.objects.values('shape_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # 판독의별 통계
            doctor_stats = AnnotationResult.objects.values('doctor_name', 'doctor_id').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
            
            # 최근 7일 통계
            week_ago = timezone.now() - timedelta(days=7)
            recent_count = AnnotationResult.objects.filter(
                created_at__gte=week_ago
            ).count()
            
            # 라벨별 통계
            label_stats = AnnotationResult.objects.values('label').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
            
            return Response({
                'status': 'success',
                'stats': {
                    'total_count': total_count,
                    'recent_count': recent_count,
                    'shape_stats': list(shape_stats),
                    'doctor_stats': list(doctor_stats),
                    'label_stats': list(label_stats)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'통계 조회 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



            