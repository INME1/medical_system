# from rest_framework import viewsets
# from .models import NoticeCommon, NoticeRIS
# from .serializers import NoticeCommonSerializer, NoticeRISSerializer

# class NoticeCommonViewSet(viewsets.ReadOnlyModelViewSet):
#     queryset = NoticeCommon.objects.all()
#     serializer_class = NoticeCommonSerializer

# class NoticeRISViewSet(viewsets.ReadOnlyModelViewSet):
#     queryset = NoticeRIS.objects.all()
#     serializer_class = NoticeRISSerializer


# views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import NoticeCommon, NoticeRIS
from .serializers import NoticeCommonSerializer, NoticeRISSerializer
from django.db import models

class NoticeCommonViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NoticeCommonSerializer
    
    def get_queryset(self):
        """활성화된 공지사항만 기본 조회"""
        queryset = NoticeCommon.objects.all()
        
        # 쿼리 파라미터 처리
        active_only = self.request.query_params.get('active_only', 'true').lower()
        if active_only == 'true':
            now = timezone.now()
            queryset = queryset.filter(
                is_active=True,
                start_date__lte=now
            ).filter(
                models.Q(end_date__isnull=True) | models.Q(end_date__gt=now)
            )
        
        notice_type = self.request.query_params.get('notice_type')
        if notice_type:
            queryset = queryset.filter(notice_type=notice_type)
        
        return queryset.order_by('-is_pinned', 'notice_type', '-created_at')
    
    @action(detail=False, methods=['get'])
    def important(self, request):
        """중요 공지사항만 조회"""
        important_notices = self.get_queryset().filter(notice_type='important')
        serializer = self.get_serializer(important_notices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pinned(self, request):
        """상단 고정 공지사항만 조회"""
        pinned_notices = self.get_queryset().filter(is_pinned=True)
        serializer = self.get_serializer(pinned_notices, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """조회수 증가"""
        notice = self.get_object()
        notice.increment_views()
        return Response({'views': notice.views})

class NoticeRISViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NoticeRISSerializer
    
    def get_queryset(self):
        """활성화된 공지사항만 기본 조회"""
        queryset = NoticeRIS.objects.all()
        
        # 쿼리 파라미터 처리
        active_only = self.request.query_params.get('active_only', 'true').lower()
        if active_only == 'true':
            now = timezone.now()
            queryset = queryset.filter(
                is_active=True,
                start_date__lte=now
            ).filter(
                models.Q(end_date__isnull=True) | models.Q(end_date__gt=now)
            )
        
        notice_type = self.request.query_params.get('notice_type')
        if notice_type:
            queryset = queryset.filter(notice_type=notice_type)
        
        target_department = self.request.query_params.get('target_department')
        if target_department:
            queryset = queryset.filter(target_department=target_department)
        
        return queryset.order_by('-is_pinned', 'notice_type', '-created_at')
    
    @action(detail=False, methods=['get'])
    def important(self, request):
        """중요 공지사항만 조회"""
        important_notices = self.get_queryset().filter(notice_type='important')
        serializer = self.get_serializer(important_notices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pinned(self, request):
        """상단 고정 공지사항만 조회"""
        pinned_notices = self.get_queryset().filter(is_pinned=True)
        serializer = self.get_serializer(pinned_notices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_department(self, request):
        """부서별 공지사항 조회"""
        department = request.query_params.get('department')
        if not department:
            return Response(
                {'error': 'department 파라미터가 필요합니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notices = self.get_queryset().filter(target_department=department)
        serializer = self.get_serializer(notices, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """조회수 증가"""
        notice = self.get_object()
        notice.increment_views()
        return Response({'views': notice.views})

