from rest_framework.decorators import api_view

@api_view(['GET'])
def test_database_connections(request):
    """모든 데이터베이스 연결 테스트 API"""
    from django.db import connections
    
    results = {}
    
    for db_name in connections:
        try:
            db_connection = connections[db_name]
            
            with db_connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            # 데이터베이스 세부 정보
            with db_connection.cursor() as cursor:
                if db_name == 'default':  # MariaDB
                    cursor.execute("SELECT VERSION(), DATABASE()")
                    version, db_name_result = cursor.fetchone()
                    results[db_name] = {
                        'status': 'success',
                        'version': version,
                        'database': db_name_result,
                        'engine': 'MariaDB'
                    }
                elif db_name == 'openmrs':  # OpenMRS MySQL
                    cursor.execute("SELECT VERSION(), DATABASE()")
                    version, db_name_result = cursor.fetchone()
                    cursor.execute("SELECT COUNT(*) FROM users")
                    user_count = cursor.fetchone()[0]
                    results[db_name] = {
                        'status': 'success',
                        'version': version,
                        'database': db_name_result,
                        'engine': 'MySQL',
                        'users_count': user_count
                    }
                elif db_name == 'orthanc_p':  # PostgreSQL
                    cursor.execute("SELECT version()")
                    version = cursor.fetchone()[0]
                    results[db_name] = {
                        'status': 'success',
                        'version': version.split(',')[0],
                        'engine': 'PostgreSQL'
                    }
                    
        except Exception as e:
            results[db_name] = {
                'status': 'error',
                'error': str(e)
            }
    
    return Response({
        'database_connections': results,
        'timestamp': timezone.now().isoformat()
    })

# URLs에 추가: path('test-db/', views.test_database_connections, name='test_database_connections'),