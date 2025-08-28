from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Count, Q
from .models import DrReport
from .serializers import (
    DrReportSerializer,
    DrReportCreateSerializer,
    DrReportListSerializer,
    DrReportStatusUpdateSerializer,
    DrReportSummarySerializer
)
# 👈 AI 분석 결과 모델과 워크리스트 모델 import 추가
from ai_analysis.models import AIAnalysisResult
from worklists.models import StudyRequest

class ReportSaveView(APIView):
    """레포트 저장 API - React에서 호출하는 메인 API"""
    
    def post(self, request):
        try:
            # 요청 데이터 검증
            serializer = DrReportCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'status': 'error',
                    'message': '데이터 검증 실패',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = serializer.validated_data
            study_uid = validated_data['study_uid']
            report_content = validated_data.get('report_content', '')
            report_status = validated_data.get('report_status', 'draft')
            
            # 👈 이미 저장된 AI 분석 결과에서 환자 정보 가져오기
            ai_result = AIAnalysisResult.objects.filter(study_uid=study_uid).first()
            if not ai_result:
                return Response({
                    'status': 'error',
                    'message': f'Study UID {study_uid}에 해당하는 AI 분석 결과를 찾을 수 없습니다.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            patient_id = ai_result.patient_id
            
            # 👈 환자ID로 worklist에서 배정된 판독의 조회
            try:
                study_request = StudyRequest.objects.filter(patient_id=patient_id).first()
                if study_request and study_request.assigned_radiologist:
                    # 실제 배정된 판독의 정보 사용
                    radiologist = study_request.assigned_radiologist  # Doctor 모델 인스턴스
                    doctor_name = radiologist.name  # 의사 이름
                    doctor_id = radiologist.medical_id  # 👈 의료진식별번호 사용 (R0001 형태)
                else:
                    # fallback: 기본값 사용 (배정되지 않은 경우)
                    doctor_name = '미배정'
                    doctor_id = 'UNASSIGNED'
            except Exception as e:
                # 에러 발생 시 기본값 사용
                print(f"판독의 조회 중 에러: {e}")
                doctor_name = '김영상'  # 임시 fallback
                doctor_id = 'DR001'
            
            # 트랜잭션으로 안전하게 처리
            with transaction.atomic():
                # 기존 레포트가 있으면 업데이트, 없으면 생성
                report, created = DrReport.objects.update_or_create(
                    study_uid=study_uid,
                    defaults={
                        'patient_id': patient_id,  # 👈 AI 분석 결과에서 가져온 patient_id 사용
                        'dr_report': report_content,
                        'report_status': report_status,
                        # 👈 실제 판독의 정보 사용 (하드코딩 제거)
                        'doctor_id': doctor_id,
                        'doctor_name': doctor_name,
                    }
                )
            
            action = '생성' if created else '업데이트'
            
            return Response({
                'status': 'success',
                'message': f'레포트가 {action}되었습니다',
                'data': {
                    'report_id': report.id,
                    'study_uid': study_uid,
                    'patient_id': patient_id,
                    'doctor_name': doctor_name,  # 👈 실제 사용된 판독의 이름 반환
                    'doctor_id': doctor_id,      # 👈 판독의 ID도 추가
                    'created': created,
                    'report_status': report.report_status
                }
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'저장 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReportLoadView(APIView):
    """레포트 불러오기 API - React에서 호출하는 메인 API"""
    
    def get(self, request, study_uid):
        try:
            # 해당 study_uid의 레포트 조회
            report = get_object_or_404(DrReport, study_uid=study_uid)
            serializer = DrReportSerializer(report)
            
            # 👈 환자 정보 보완
            report_data = serializer.data
            
            # 워크리스트에서 환자 이름과 검사일 가져오기
            try:
                study_request = StudyRequest.objects.filter(
                    patient_id=report.patient_id
                ).first()
                
                if study_request:
                    # 환자 정보 추가
                    report_data['patient_name'] = study_request.patient_name
                    
                    # 👈 scheduled_exam_datetime에서 검사일 가져오기
                    if study_request.scheduled_exam_datetime:
                        # 날짜와 시간 모두 전달 (ReportModal에서 날짜만 사용)
                        report_data['study_date'] = study_request.scheduled_exam_datetime.strftime('%Y-%m-%d')
                        report_data['study_datetime'] = study_request.scheduled_exam_datetime.strftime('%Y-%m-%d %H:%M:%S')
                    else:
                        report_data['study_date'] = 'Unknown'
                        report_data['study_datetime'] = 'Unknown'
                else:
                    # 워크리스트에 없는 경우 기본값
                    report_data['patient_name'] = 'Unknown'
                    report_data['study_date'] = 'Unknown'
                    report_data['study_datetime'] = 'Unknown'
                    
            except Exception as e:
                print(f"환자 정보 조회 중 에러: {e}")
                # 에러 발생 시 기본값
                report_data['patient_name'] = 'Unknown'
                report_data['study_date'] = 'Unknown' 
                report_data['study_datetime'] = 'Unknown'
            
            return Response({
                'status': 'success',
                'report': report_data
            }, status=status.HTTP_200_OK)
            
        except DrReport.DoesNotExist:
            return Response({
                'status': 'error',
                'message': '해당 Study UID의 레포트를 찾을 수 없습니다'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'불러오기 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReportListView(APIView):
    """전체 레포트 목록 조회"""
    
    def get(self, request):
        try:
            # 쿼리 파라미터로 필터링
            queryset = DrReport.objects.all()
            
            # patient_id 필터
            patient_id = request.GET.get('patient_id')
            if patient_id:
                queryset = queryset.filter(patient_id__icontains=patient_id)
            
            # study_uid 필터
            study_uid = request.GET.get('study_uid')
            if study_uid:
                queryset = queryset.filter(study_uid__icontains=study_uid)
            
            # 상태 필터
            report_status = request.GET.get('status')
            if report_status:
                queryset = queryset.filter(report_status=report_status)
            
            # 의사 필터
            doctor_name = request.GET.get('doctor')
            if doctor_name:
                queryset = queryset.filter(doctor_name__icontains=doctor_name)
            
            # 내용 유무 필터
            has_content = request.GET.get('has_content')
            if has_content == 'true':
                queryset = queryset.exclude(Q(dr_report='') | Q(dr_report__isnull=True))
            elif has_content == 'false':
                queryset = queryset.filter(Q(dr_report='') | Q(dr_report__isnull=True))
            
            # 정렬
            order_by = request.GET.get('order_by', '-updated_at')
            if order_by in ['created_at', '-created_at', 'updated_at', '-updated_at', 'patient_id', '-patient_id']:
                queryset = queryset.order_by(order_by)
            else:
                queryset = queryset.order_by('-updated_at')
            
            # 페이지네이션
            page_size = int(request.GET.get('page_size', 20))
            page = int(request.GET.get('page', 1))
            start = (page - 1) * page_size
            end = start + page_size
            
            total_count = queryset.count()
            reports = queryset[start:end]
            
            serializer = DrReportListSerializer(reports, many=True)
            
            return Response({
                'status': 'success',
                'reports': serializer.data,
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

class ReportDetailView(APIView):
    """개별 레포트 조회/수정/삭제"""
    
    def get(self, request, report_id):
        """개별 레포트 조회"""
        try:
            report = get_object_or_404(DrReport, id=report_id)
            serializer = DrReportSerializer(report)
            return Response({
                'status': 'success',
                'report': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'조회 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, report_id):
        """개별 레포트 수정"""
        try:
            report = get_object_or_404(DrReport, id=report_id)
            serializer = DrReportSerializer(report, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'status': 'success',
                    'message': '레포트가 수정되었습니다',
                    'report': serializer.data
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
    
    def delete(self, request, report_id):
        """개별 레포트 삭제"""
        try:
            report = get_object_or_404(DrReport, id=report_id)
            study_uid = report.study_uid
            report.delete()
            
            return Response({
                'status': 'success',
                'message': '레포트가 삭제되었습니다',
                'study_uid': study_uid
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'삭제 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReportDeleteView(APIView):
    """특정 study_uid 레포트 삭제 (React용)"""
    
    def delete(self, request, study_uid):
        try:
            report = get_object_or_404(DrReport, study_uid=study_uid)
            report.delete()
            
            return Response({
                'status': 'success',
                'message': '레포트가 삭제되었습니다',
                'study_uid': study_uid
            }, status=status.HTTP_200_OK)
            
        except DrReport.DoesNotExist:
            return Response({
                'status': 'error',
                'message': '해당 Study UID의 레포트를 찾을 수 없습니다'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'삭제 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class ReportStatusUpdateView(APIView):
#     """레포트 상태 업데이트"""
    
#     def patch(self, request, study_uid):
#         try:
#             report = get_object_or_404(DrReport, study_uid=study_uid)
#             serializer = DrReportStatusUpdateSerializer(data=request.data)
            
#             if serializer.is_valid():
#                 report.report_status = serializer.validated_data['report_status']
#                 report.save()
                
#                 return Response({
#                     'status': 'success',
#                     'message': '레포트 상태가 업데이트되었습니다',
#                     'report_status': report.report_status,
#                     'report_status_display': report.get_report_status_display()
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
#                 'message': f'상태 업데이트 실패: {str(e)}'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class ReportStatusUpdateView(APIView):
    """레포트 상태 업데이트 + 워크리스트 연동"""
    
    def patch(self, request, study_uid):
        try:
            report = get_object_or_404(DrReport, study_uid=study_uid)
            serializer = DrReportStatusUpdateSerializer(data=request.data)
            
            if serializer.is_valid():
                new_status = serializer.validated_data['report_status']
                
                # 🔥 트랜잭션으로 안전하게 처리
                with transaction.atomic():
                    # 1. 레포트 상태 업데이트
                    report.report_status = new_status
                    report.save()
                    
                    # 2. 👈 워크리스트도 함께 업데이트
                    try:
                        from worklists.models import StudyRequest
                        
                        # patient_id로 해당 StudyRequest 찾기
                        study_request = StudyRequest.objects.filter(
                            patient_id=report.patient_id
                        ).first()
                        
                        if study_request:
                            # 🎯 레포트 상태에 따른 워크리스트 상태 매핑
                            status_mapping = {
                                'draft': '작성중',
                                'completed': '작성완료', 
                                'approved': '작성완료'  # 👈 승인도 작성완료로 통일
                            }
                            
                            # 워크리스트 report_status 업데이트
                            mapped_status = status_mapping.get(new_status, '작성중')
                            study_request.report_status = mapped_status
                            study_request.save()
                            
                            print(f"✅ 워크리스트 상태 업데이트: {study_request.patient_name} → {mapped_status}")
                        else:
                            print(f"⚠️ 환자 {report.patient_id}의 StudyRequest를 찾을 수 없음")
                    
                    except Exception as e:
                        print(f"❌ 워크리스트 업데이트 실패: {e}")
                        # 트랜잭션이므로 여기서 에러나면 레포트 업데이트도 롤백됨
                        raise e
                
                return Response({
                    'status': 'success',
                    'message': '레포트 및 워크리스트 상태가 업데이트되었습니다',
                    'report_status': report.report_status,
                    'report_status_display': report.get_report_status_display(),
                    'study_uid': study_uid,
                    'patient_id': report.patient_id
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
                'message': f'상태 업데이트 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReportSummaryView(APIView):
    """레포트 통계 요약"""
    
    def get(self, request):
        try:
            # 전체 통계
            total_reports = DrReport.objects.count()
            draft_count = DrReport.objects.filter(report_status='draft').count()
            completed_count = DrReport.objects.filter(report_status='completed').count()
            approved_count = DrReport.objects.filter(report_status='approved').count()
            
            # 최근 레포트 (5개)
            recent_reports = DrReport.objects.order_by('-updated_at')[:5]
            recent_serializer = DrReportListSerializer(recent_reports, many=True)
            
            summary_data = {
                'total_reports': total_reports,
                'draft_count': draft_count,
                'completed_count': completed_count,
                'approved_count': approved_count,
                'recent_reports': recent_serializer.data
            }
            
            return Response({
                'status': 'success',
                'summary': summary_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'통계 조회 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)