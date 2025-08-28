import requests
import json
import random
from datetime import datetime, timedelta
from faker import Faker

# 한국어 Faker 초기화
fake = Faker('ko_KR')

# API 설정 - 올바른 엔드포인트로 수정
API_BASE_URL = "http://localhost:8000/api"
EMR_ENDPOINT = f"{API_BASE_URL}/worklist/create-from-emr/"

# 더미 데이터 설정
MODALITY_OPTIONS = ['CR', 'MR', 'CT', 'US', 'NM', 'PT', 'DX']
PRIORITY = '일반'
SEX_OPTIONS = ['M', 'F']

# 🔥 새로운 한국어 이름 생성을 위한 성씨와 이름 리스트
KOREAN_SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전', '홍', '고', '문', '양', '손', '배', '조', '백', '허', '유']

KOREAN_GIVEN_NAMES = [
    # 남성 이름들
    '민석', '준호', '시우', '도현', '예준', '서준', '지호', '하준', '주원', '도윤',
    '건우', '우진', '선우', '연우', '현우', '민준', '지훈', '재윤', '시후', '준서',
    '승민', '지한', '태현', '진우', '시원', '은우', '윤호', '유찬', '정우', '강민',
    # 여성 이름들  
    '서연', '지우', '하은', '민서', '지유', '채원', '지민', '수아', '하윤', '예은',
    '소율', '지원', '유나', '서진', '나연', '유진', '예린', '다인', '소현', '하린',
    '윤서', '서우', '예나', '시은', '채윤', '수빈', '민지', '하영', '서영', '예원'
]

# 새로운 신체 부위별 검사 매핑 (더 다양하게)
BODY_PART_BY_MODALITY = {
    'CR': ['흉부', '복부', '손목', '발목', '무릎', '골반', '어깨', '팔꿈치', '발가락', '손가락'],
    'MR': ['뇌', '척추', '무릎', '어깨', '골반', '복부', '목', '발목', '손목', '허리'],
    'CT': ['뇌', '흉부', '복부', '골반', '목', '척추', '부비동', '간', '신장', '폐'],
    'US': ['복부', '골반', '갑상선', '심장', '혈관', '유방', '간', '신장', '담낭', '자궁'],
    'NM': ['뼈', '심장', '신장', '폐', '갑상선', '뇌', '간', '담낭', '골수', '림프절'],
    'PT': ['전신', '뇌', '심장', '폐', '복부', '골반', '림프절', '갑상선', '뼈', '간'],
    'DX': ['흉부', '복부', '골반', '척추', '사지', '두경부', '유방', '치아', '부비동', '관절']
}

# 🔥 새로운 의사 이름 리스트
PHYSICIANS = [
    '김현우', '이소영', '박정민', '최다영', '정재현', '강민수', '조예린', '윤성진',
    '장하나', '임태호', '한지원', '오민지', '서준혁', '신윤아', '권도현', '황세린',
    '안준서', '송미래', '류현석', '전소희', '홍지후', '고은별', '문준영', '양서현',
    '손태영', '배지안', '조민우', '백예슬', '허준호', '유다인'
]

def generate_korean_name():
    """새로운 한국어 3글자 이름 생성"""
    surname = random.choice(KOREAN_SURNAMES)
    given_name = random.choice(KOREAN_GIVEN_NAMES)[:2]  # 2글자로 제한
    return f"{surname}{given_name}"

def generate_patient_id():
    """P + 4자리 숫자 형태의 환자 ID 생성"""
    return f"P{random.randint(1000, 9999)}"

def generate_birth_date():
    """랜덤 생년월일 생성 (20~80세 범위)"""
    today = datetime.now()
    start_date = today - timedelta(days=80*365)
    end_date = today - timedelta(days=20*365)
    
    random_date = fake.date_between(start_date=start_date, end_date=end_date)
    return random_date.strftime('%Y-%m-%d')

def generate_recent_request_datetime():
    """🔥 2~3일 전 랜덤 시간 생성"""
    now = datetime.now()
    
    # 2일 전과 3일 전 사이의 랜덤한 날짜 선택
    days_ago = random.randint(2, 3)
    target_date = now - timedelta(days=days_ago)
    
    # 업무 시간 (오전 8시 ~ 오후 6시) 내의 랜덤한 시간 생성
    hour = random.randint(8, 17)  # 8시~17시
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    
    target_datetime = target_date.replace(
        hour=hour, 
        minute=minute, 
        second=second, 
        microsecond=0
    )
    
    # ISO 8601 형식 (Z 포함)으로 반환
    return target_datetime.strftime('%Y-%m-%dT%H:%M:%S.000Z')

def generate_study_request():
    """StudyRequest 더미 데이터 생성"""
    modality = random.choice(MODALITY_OPTIONS)
    body_part = random.choice(BODY_PART_BY_MODALITY[modality])
    
    # 🔥 처음부터 2~3일 전 날짜로 설정
    target_datetime = generate_recent_request_datetime()
    
    data = {
        'patient_id': generate_patient_id(),
        'patient_name': generate_korean_name(),
        'birth_date': generate_birth_date(),
        'sex': random.choice(SEX_OPTIONS),
        'modality': modality,
        'body_part': body_part,
        'requesting_physician': random.choice(PHYSICIANS),
        'priority': PRIORITY,
        'study_description': f"{body_part} {modality} 검사",
        'clinical_info': f"{body_part} 부위 이상 소견으로 {modality} 검사 의뢰합니다.",
        'request_datetime': target_datetime  # 🔥 처음부터 과거 날짜 포함
    }
    
    return data

def send_study_request(data):
    """API로 StudyRequest 전송 (이미 과거 날짜 포함)"""
    try:
        target_date = data.get('request_datetime', '').split('T')[0] if 'request_datetime' in data else '오늘'
        
        print(f"📤 전송 중: {data['patient_name']} ({data['patient_id']}) - {data['modality']} [날짜: {target_date}]")
        
        response = requests.post(
            EMR_ENDPOINT,
            json=data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 201:
            result = response.json()
            if result.get('success'):
                study_id = result['data']['id']
                print(f"✅ 성공: {result['data']['patient_name']} (ID: {study_id}) - 날짜: {target_date}")
                return True
            else:
                print(f"❌ 실패: {result.get('error', '알 수 없는 오류')}")
                return False
        else:
            print(f"❌ HTTP 오류: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   상세: {error_detail}")
            except:
                print(f"   응답: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 네트워크 오류: {e}")
        return False
    except Exception as e:
        print(f"❌ 예외 발생: {e}")
        return False

# 더미 데이터 생성이 완료되면 불필요한 함수 제거
# def update_request_datetime(study_id, target_datetime):
#     """🔥 생성된 StudyRequest의 날짜를 2~3일 전으로 업데이트"""
#     # 이 함수는 이제 사용하지 않음 (처음부터 과거 날짜로 생성)

def main():
    """메인 실행 함수"""
    print("🏥 CDSS 더미 데이터 생성 시작 (2~3일 전 데이터, 새로운 이름)")
    print(f"📡 API 엔드포인트: {EMR_ENDPOINT}")
    
    # 날짜 정보 표시
    today = datetime.now()
    two_days_ago = today - timedelta(days=2)
    three_days_ago = today - timedelta(days=3)
    print(f"📅 생성 대상 날짜: {three_days_ago.strftime('%Y-%m-%d')} ~ {two_days_ago.strftime('%Y-%m-%d')}")
    print(f"⏰ 생성 시간대: 오전 8시 ~ 오후 5시 (업무시간)")
    print("📋 참고: 처음부터 과거 날짜로 request_datetime 설정")
    print("=" * 70)
    
    # 더미 데이터 25개 생성 및 전송 (기존 20개에서 증가)
    total_count = 25
    success_count = 0
    failed_count = 0
    
    for i in range(1, total_count + 1):
        print(f"\n[{i}/{total_count}]", end=" ")
        
        # 더미 데이터 생성 (이미 과거 날짜 포함)
        study_data = generate_study_request()
        
        # API 전송
        if send_study_request(study_data):
            success_count += 1
        else:
            failed_count += 1
        
        # 서버 부하 방지를 위한 약간의 지연
        import time
        time.sleep(0.3)  # 0.5초에서 0.3초로 단축
    
    print("\n" + "=" * 70)
    print(f"🎯 더미 데이터 생성 완료!")
    print(f"✅ 성공: {success_count}개")
    print(f"❌ 실패: {failed_count}개")
    print(f"📊 성공률: {(success_count/total_count)*100:.1f}%")
    
    if success_count > 0:
        print(f"\n🔍 Django Admin이나 React 앱에서 확인해보세요:")
        print(f"   - Django Admin: http://localhost:8000/admin/")
        print(f"   - React 워크리스트: http://localhost:3000/")
        print(f"\n📈 생성된 데이터 특징:")
        print(f"   - 날짜 범위: 2~3일 전")
        print(f"   - 시간대: 업무시간 (8:00~17:59)")
        print(f"   - 새로운 한국어 이름 사용")
        print(f"   - 다양한 검사 부위 및 모달리티")
        print(f"   - 처음부터 과거 날짜로 생성 (업데이트 없음)")

if __name__ == "__main__":
    # 의존성 확인
    try:
        import requests
        from faker import Faker
    except ImportError as e:
        print("❌ 필요한 패키지가 설치되지 않았습니다:")
        print("   pip install requests faker")
        exit(1)
    
    main()