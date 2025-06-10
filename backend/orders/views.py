from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import TestOrder # Sample #밑에 주석에 관한 겁니다..ㅠㅠ
from .serializers import TestOrderSerializer
from django.shortcuts import get_object_or_404
import logging

logger = logging.getLogger('medical_integration')

@api_view(['GET'])
def list_orders(request):
    orders = TestOrder.objects.all()
    serializer = TestOrderSerializer(orders, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST']) # 요청 받아오기 
def create_order(request):
    logger.debug("✅ POST 요청 도착")
    logger.debug(f"받은 데이터: {request.data}")
    
    print("POST된 데이터:", request.data)
    serializer = TestOrderSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    print(serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET']) # 요청 확인하기 
def get_order(request, order_id):
    order = get_object_or_404(TestOrder, id=order_id)
    serializer = TestOrderSerializer(order)
    return Response(serializer.data, status=status.HTTP_200_OK)


# 로그 저장하는 데 필요하다고 해서 넣었어요,. 
# 오류나면 주석처리 부탁드립니다ㅠㅜ
# @api_view(['POST'])
# def create_sample(request):
#     try:
#         sample_id = request.data.get('sample_id')
#         order_id = request.data.get('order_id')  # 여기에서 order_id를 받아옴
#         test_type = request.data.get('test_type')
#         collection_date = request.data.get('collection_date')

#         if not all([sample_id, order_id, test_type, collection_date]):
#             return Response({"error": "필수 필드가 누락되었습니다."}, status=status.HTTP_400_BAD_REQUEST)

#         # TestOrder 객체를 가져옵니다. order_id로 찾기
#         order = TestOrder.objects.get(id=order_id)
        
#         # Sample 모델에 샘플 등록
#         sample = Sample.objects.create(
#             sample_id=sample_id,
#             order=order,  # TestOrder 객체를 연결
#             test_type=test_type,
#             collection_date=collection_date
#         )

#         return Response({"message": "샘플 등록 완료", "sample_id": sample.id}, status=status.HTTP_201_CREATED)

#     except TestOrder.DoesNotExist:
#         return Response({"error": "해당 오더를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

#     except Exception as e:
#         return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)