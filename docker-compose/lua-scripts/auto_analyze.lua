function OnStoredInstance(instanceId, tags, metadata, origin)
    -- 새로운 DICOM 인스턴스가 저장될 때마다 자동 실행
    print("=== 새 DICOM 인스턴스 저장됨 ===")
    print("Instance ID: " .. instanceId)
    print("Origin: " .. tostring(origin["RequestOrigin"]))
    
    -- AI 서비스에 자동 분석 요청
    local aiServiceUrl = "http://ai-service:5000/analyze/" .. instanceId
    
    print("AI 분석 요청 시작: " .. aiServiceUrl)
    
    -- 비동기 HTTP POST 요청으로 AI 분석 트리거 (타임아웃 무시)
    pcall(function()
        local response = HttpPost(aiServiceUrl, "{}", {
            ["Content-Type"] = "application/json"
        })
        
        if response ~= nil then
            print("AI 분석 요청 성공: " .. instanceId)
            print("응답: " .. tostring(response))
        else
            print("AI 분석 요청 실패: " .. instanceId)
        end
    end)
    
    print("AI 분석 요청 전송 완료 (비동기): " .. instanceId)
    print("=== AI 분석 요청 완료 ===")
end

function Initialize()
    print("Orthanc AI 자동 분석 스크립트 시작됨 (비동기 모드)")
end

function Finalize()
    print("Orthanc AI 자동 분석 스크립트 종료됨")
end