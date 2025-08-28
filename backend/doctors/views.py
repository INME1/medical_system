# backend/doctors/views.py - 수정
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Doctor
from .serializers import DoctorSerializer, RadiologistSerializer
import logging
import uuid

logger = logging.getLogger(__name__)

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
        
    @action(detail=False, methods=['get'])
    def current_user(self, request):
        """현재 사용자 정보 조회"""
        try:
            doctor = Doctor.objects.first()
            
            if not doctor:
                # 의사가 없으면 기본 의사 생성 (unique 제약 고려)
                doctor = Doctor.objects.create(
                    name="기본의사",
                    department="영상의학과",
                    medical_id=f"DOC_{uuid.uuid4().hex[:8].upper()}",  # 고유 ID 생성
                    role="의사",
                    status="온라인"
                )
                logger.info(f"Default doctor created: {doctor.name}")
            
            serializer = self.get_serializer(doctor)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in current_user: {e}")
            return Response(
                {'error': '의사 정보를 찾을 수 없습니다.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def radiologists(self, request):
        """React에서 사용할 방사선사 목록"""
        try:
            # 영상의학과 의사들만 필터링
            radiologists = Doctor.objects.filter(
                department="영상의학과"
            ).order_by('id')
            
            # 방사선사가 없으면 기본 데이터 생성
            if not radiologists.exists():
                default_radiologists = [
                    {
                        'name': '김영상',
                        'department': '영상의학과',
                        'medical_id': f'RAD_{uuid.uuid4().hex[:8].upper()}',
                        'role': '방사선사',
                        'status': '온라인'
                    },
                    {
                        'name': '이촬영',
                        'department': '영상의학과',
                        'medical_id': f'RAD_{uuid.uuid4().hex[:8].upper()}',
                        'role': '방사선사',
                        'status': '온라인'
                    },
                    {
                        'name': '박판독',
                        'department': '영상의학과',
                        'medical_id': f'RAD_{uuid.uuid4().hex[:8].upper()}',
                        'role': '방사선사',
                        'status': '자리 비움'
                    }
                ]
                
                for rad_data in default_radiologists:
                    Doctor.objects.create(**rad_data)
                
                radiologists = Doctor.objects.filter(department='영상의학과')
                logger.info(f"Default radiologists created: {radiologists.count()}")
            
            # React에서 기대하는 형태로 데이터 구성
            radiologist_data = []
            colors = ['radiologist-blue', 'radiologist-green', 'radiologist-purple', 'radiologist-orange']
            
            for i, doctor in enumerate(radiologists):
                radiologist_data.append({
                    'id': doctor.id,
                    'name': doctor.name,
                    'color': colors[i % len(colors)],
                    'department': doctor.department,
                    'role': doctor.role,
                    'status': doctor.status
                })
            
            return Response(radiologist_data)
            
        except Exception as e:
            logger.error(f"Error in radiologists: {e}")
            return Response(
                {'error': f'방사선사 목록 조회 실패: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['patch'], url_path='current_user/status')
    def update_current_user_status(self, request):
        """현재 사용자 상태 업데이트"""
        try:
            doctor = Doctor.objects.first()
            
            if not doctor:
                return Response(
                    {'error': '의사 정보를 찾을 수 없습니다.'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            new_status = request.data.get('status')
            
            # 유효한 상태인지 확인
            valid_statuses = ['온라인', '자리 비움']
            if new_status not in valid_statuses:
                return Response(
                    {'error': f'유효하지 않은 상태입니다. 가능한 상태: {valid_statuses}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 상태 업데이트
            doctor.status = new_status
            doctor.save()
            
            logger.info(f"Doctor status updated: {doctor.name} -> {new_status}")
            
            # 업데이트된 정보 반환
            serializer = self.get_serializer(doctor)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error updating status: {e}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )