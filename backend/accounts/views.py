from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from .models import Notice
from django.utils import timezone
from django.contrib.auth import authenticate, login
from .models import UserProfile

@api_view(['POST'])
@permission_classes([IsAdminUser])
def update_notice(request):
    message = request.data.get("message")
    Notice.objects.all().delete()
    Notice.objects.create(message=message)
    return Response({"message": "공지 등록 완료"})

@api_view(['POST'])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    code = request.data.get("code")

    user = authenticate(request, username=username, password=password)
    if user:
        try:
            profile = UserProfile.objects.get(user=user)
            if profile.code == code:
                login(request, user)
                return Response({"message": "로그인 성공", "user_id": user.id})
            else:
                return Response({"error": "코드 불일치"}, status=401)
        except UserProfile.DoesNotExist:
            return Response({"error": "UserProfile 없음"}, status=400)
    return Response({"error": "인증 실패"}, status=401)



@api_view(['POST'])
def auto_login_view(request):
    code = request.data.get('code')
    try:
        profile = UserProfile.objects.get(code=code)
        
        # 자동 로그인 세션 만료 로직 (예: 7일 이상 경과 시 거부)
        now = timezone.now()
        if profile.last_auto_login and (now - profile.last_auto_login).days > 7:
            return Response({"error": "자동 로그인 세션 만료"}, status=401)

        # 로그인 처리
        profile.last_auto_login = now
        profile.save()
        login(request, profile.user)
        return Response({"message": "자동 로그인 성공", "user_id": profile.user.id})
    except UserProfile.DoesNotExist:
        return Response({"error": "코드 불일치"}, status=401)