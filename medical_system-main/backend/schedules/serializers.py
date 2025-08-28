# backend/schedules/serializers.py - 시간 표시 문제 수정

from rest_framework import serializers
from .models import ScheduleCommon, ScheduleRIS, PersonalSchedule, ExamRoom
from doctors.models import Doctor
from datetime import datetime
from django.utils import timezone

class PersonalScheduleSerializer(serializers.ModelSerializer):
    time_display = serializers.SerializerMethodField()
    
    class Meta:
        model = PersonalSchedule
        fields = ['id', 'title', 'datetime', 'end_datetime', 'description', 'is_completed', 'time_display']
    
    def get_time_display(self, obj):
        """시간 표시 로직 수정 - 시간대 변환 문제 해결"""
        try:
            # 🔧 Django의 localtime 사용하여 정확한 로컬 시간 계산
            if obj.datetime:
                # Django 설정 시간대(Asia/Seoul)로 변환
                local_dt = timezone.localtime(obj.datetime)
                start_time = local_dt.strftime('%H:%M')
                
                print(f"🕐 time_display 계산:")
                print(f"  - 원본 datetime: {obj.datetime}")
                print(f"  - localtime 변환: {local_dt}")  
                print(f"  - start_time: {start_time}")
                
                # end_datetime 처리
                if obj.end_datetime:
                    local_end_dt = timezone.localtime(obj.end_datetime)
                    end_time = local_end_dt.strftime('%H:%M')
                    print(f"  - end_time: {end_time}")
                    return f"{start_time} ~ {end_time}"
                
                return start_time
            else:
                return "시간 정보 없음"
                
        except Exception as e:
            print(f"❌ time_display 오류: {e}")
            return "시간 계산 오류"
    
    def validate_datetime(self, value):
        """datetime 필드 검증"""
        if isinstance(value, str):
            try:
                from django.utils.dateparse import parse_datetime
                dt = parse_datetime(value)
                if dt and timezone.is_naive(dt):
                    dt = timezone.make_aware(dt)
                return dt
            except ValueError:
                raise serializers.ValidationError("올바른 datetime 형식이 아닙니다.")
        return value
    
    def validate_end_datetime(self, value):
        """end_datetime 필드 검증"""
        if not value or value == '':
            return None
        return self.validate_datetime(value)

class ScheduleCommonSerializer(serializers.ModelSerializer):
    time_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ScheduleCommon
        fields = ['id', 'title', 'datetime', 'end_datetime', 'description', 'time_display']
    
    def get_time_display(self, obj):
        try:
            if obj.datetime:
                local_dt = timezone.localtime(obj.datetime)
                start_time = local_dt.strftime('%H:%M')
                
                if obj.end_datetime:
                    local_end_dt = timezone.localtime(obj.end_datetime)
                    end_time = local_end_dt.strftime('%H:%M')
                    return f"{start_time} ~ {end_time}"
                
                return start_time
            return "시간 정보 없음"
        except Exception:
            return "시간 계산 오류"

class ScheduleRISSerializer(serializers.ModelSerializer):
    time_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ScheduleRIS
        fields = ['id', 'title', 'datetime', 'end_datetime', 'description', 'time_display']
    
    def get_time_display(self, obj):
        try:
            if obj.datetime:
                local_dt = timezone.localtime(obj.datetime)
                start_time = local_dt.strftime('%H:%M')
                
                if obj.end_datetime:
                    local_end_dt = timezone.localtime(obj.end_datetime)
                    end_time = local_end_dt.strftime('%H:%M')
                    return f"{start_time} ~ {end_time}"
                
                return start_time
            return "시간 정보 없음"
        except Exception:
            return "시간 계산 오류"

class DoctorSerializer(serializers.ModelSerializer):
    today_personal_schedules = serializers.SerializerMethodField()
    
    class Meta:
        model = Doctor
        fields = ['id', 'name', 'department', 'role', 'status', 'today_personal_schedules']
    
    def get_today_personal_schedules(self, obj):
        from datetime import date
        today = date.today()
        schedules = PersonalSchedule.objects.filter(
            doctor=obj, 
            datetime__date=today
        ).order_by('datetime')
        return PersonalScheduleSerializer(schedules, many=True).data
    
class ExamRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamRoom
        fields = ['id', 'room_id', 'name', 'room_type', 'is_active', 'description']
        
    def to_representation(self, instance):
        """React에서 사용하기 쉽도록 데이터 형태 조정"""
        data = super().to_representation(instance)
        return {
            'id': data['room_id'],
            'name': data['name'],
            'type': data['room_type'],
            'is_active': data['is_active'],
            'description': data['description']
        }