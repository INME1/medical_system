-- OpenMRS 데이터베이스 초기화
CREATE DATABASE IF NOT EXISTS openmrs CHARACTER SET utf8 COLLATE utf8_general_ci;

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON openmrs.* TO 'openmrs'@'%';
GRANT ALL PRIVILEGES ON openmrs.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- 연결 테스트
SELECT 'OpenMRS Database Initialized' as status;
