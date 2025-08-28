from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from .models import Notice, UserProfile
from django.utils import timezone
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAdminUser])
def update_notice(request):
    message = request.data.get("message")
    Notice.objects.all().delete()
    Notice.objects.create(message=message)
    return Response({"message": "공지 등록 완료"})

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])  # ✅ 추가됨
def login_view(request):
    try:
        username = request.data.get("username")
        password = request.data.get("password")
        code = request.data.get("code")
        
        print(f"로그인 시도: username={username}, code={code}")  # 디버그용
        
        user = authenticate(request, username=username, password=password)
        if user:
            try:
                profile = UserProfile.objects.get(user=user)
                print(f"프로필 코드: {profile.code}")  # 디버그용
                
                if profile.code == code:
                    login(request, user)
                    print("로그인 성공!")  # 디버그용
                    return Response({
                        "message": "로그인 성공", 
                        "user_id": user.id,
                        "username": user.username
                    })
                else:
                    print("코드 불일치")  # 디버그용
                    return Response({"error": "코드 불일치"}, status=401)
            except UserProfile.DoesNotExist:
                print("UserProfile 없음")  # 디버그용
                return Response({"error": "UserProfile 없음"}, status=400)
        else:
            print("인증 실패")  # 디버그용
            return Response({"error": "인증 실패"}, status=401)
    except Exception as e:
        print(f"로그인 오류: {str(e)}")  # 디버그용
        return Response({"error": f"로그인 처리 중 오류: {str(e)}"}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])  # ✅ 추가됨
def auto_login_view(request):
    try:
        code = request.data.get('code')
        print(f"자동 로그인 시도: code={code}")  # 디버그용
        
        profile = UserProfile.objects.get(code=code)
        
        # 자동 로그인 세션 만료 로직 (예: 7일 이상 경과 시 거부)
        now = timezone.now()
        if profile.last_auto_login and (now - profile.last_auto_login).days > 7:
            print("자동 로그인 세션 만료")  # 디버그용
            return Response({"error": "자동 로그인 세션 만료"}, status=401)

        # 로그인 처리
        profile.last_auto_login = now
        profile.save()
        login(request, profile.user)
        print("자동 로그인 성공!")  # 디버그용
        
        return Response({
            "message": "자동 로그인 성공", 
            "user_id": profile.user.id,
            "username": profile.user.username
        })
    except UserProfile.DoesNotExist:
        print("코드 불일치")  # 디버그용
        return Response({"error": "코드 불일치"}, status=401)
    except Exception as e:
        print(f"자동 로그인 오류: {str(e)}")  # 디버그용
        return Response({"error": f"자동 로그인 처리 중 오류: {str(e)}"}, status=500)

# 공지사항 조회용 뷰 추가
@api_view(['GET'])
@permission_classes([AllowAny])
def get_notice(request):
    try:
        notice = Notice.objects.latest('created_at')
        return Response({"notice": notice.message})
    except Notice.DoesNotExist:
        return Response({"notice": ""})