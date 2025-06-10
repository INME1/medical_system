from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import AnnotationResult
from .serializers import (
    AnnotationResultSerializer, 
    AnnotationResultCreateSerializer,
    AnnotationResultListSerializer
)
# 👈 AI 분석과 동일한 import 추가
from ai_analysis.pacs_utils import get_patient_info_from_pacs

class AnnotationSaveView(APIView):
    """어노테이션 저장 API - React에서 호출하는 메인 API"""
    
    def post(self, request):
        try:
            # 요청 데이터에서 study_uid만 받기 (AI 분석과 동일)
            study_uid = request.data.get('study_uid')
            annotations = request.data.get('annotations', [])
            
            if not study_uid:
                return Response({
                    'status': 'error',
                    'message': 'study_uid가 필요합니다'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not annotations:
                return Response({
                    'status': 'error',
                    'message': '최소 하나의 어노테이션이 필요합니다'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 👈 AI 분석과 동일하게 PACS에서 환자 정보 가져오기
            patient_info = get_patient_info_from_pacs(study_uid)
            if not patient_info:
                return Response({
                    'status': 'error',
                    'message': f'PACS에서 Study UID {study_uid}에 해당하는 환자 정보를 찾을 수 없습니다.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            patient_id = patient_info['patient_id']
            
            # 트랜잭션으로 안전하게 처리
            with transaction.atomic():
                # 기존 어노테이션 삭제 (새로 저장)
                deleted_count = AnnotationResult.objects.filter(study_uid=study_uid).delete()[0]
                
                # 새 어노테이션들 저장
                saved_annotations = []
                for ann_data in annotations:
                    annotation = AnnotationResult.objects.create(
                        study_uid=study_uid,
                        patient_id=patient_id,  # 👈 PACS에서 가져온 patient_id 사용
                        series_uid=f"{study_uid}.1",  # 임시값
                        instance_uid=f"{study_uid}.1.1",  # 임시값
                        instance_number=1,  # 임시값
                        label=ann_data['label'],
                        bbox=ann_data['bbox'],
                        dr_text=ann_data.get('dr_text', ''),
                        # doctor_id, doctor_name은 모델에서 기본값 사용
                    )
                    saved_annotations.append(annotation)
            
            return Response({
                'status': 'success',
                'message': f'{len(saved_annotations)}개 어노테이션이 저장되었습니다',
                'data': {
                    'study_uid': study_uid,
                    'patient_id': patient_id,
                    'saved_count': len(saved_annotations),
                    'deleted_count': deleted_count
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'저장 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AnnotationLoadView(APIView):
    """어노테이션 불러오기 API - React에서 호출하는 메인 API"""
    
    def get(self, request, study_uid):
        try:
            # 해당 study_uid의 모든 어노테이션 조회
            annotations = AnnotationResult.objects.filter(study_uid=study_uid).order_by('-created_at')
            
            if not annotations.exists():
                return Response({
                    'status': 'success',
                    'message': '저장된 어노테이션이 없습니다',
                    'annotations': [],
                    'count': 0
                }, status=status.HTTP_200_OK)
            
            # React 코드에 맞는 형태로 데이터 포맷팅
            annotation_data = []
            for ann in annotations:
                annotation_data.append({
                    'bbox': ann.bbox,
                    'label': ann.label,
                    'confidence': 1.0,  # 수동 어노테이션은 confidence 1.0
                    'created': ann.created_at.isoformat(),
                    'dr_text': ann.dr_text or '',
                    'doctor_name': ann.doctor_name
                })
            
            return Response({
                'status': 'success',
                'annotations': annotation_data,
                'count': len(annotation_data),
                'study_uid': study_uid,
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
        """개별 어노테이션 조회"""
        try:
            annotation = get_object_or_404(AnnotationResult, id=annotation_id)
            serializer = AnnotationResultSerializer(annotation)
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
    """특정 study_uid의 모든 어노테이션 삭제"""
    
    def delete(self, request, study_uid):
        try:
            deleted_result = AnnotationResult.objects.filter(study_uid=study_uid).delete()
            deleted_count = deleted_result[0]
            
            return Response({
                'status': 'success',
                'message': f'{deleted_count}개 어노테이션이 삭제되었습니다',
                'study_uid': study_uid,
                'deleted_count': deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'삭제 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)