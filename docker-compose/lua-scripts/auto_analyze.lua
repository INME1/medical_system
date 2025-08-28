-- -- auto_analysis.lua
-- -- OnStoredInstance 함수는 새 인스턴스가 Orthanc에 저장될 때 호출됩니다.
-- function OnStoredInstance(instance_id, tags, metadata, origin)
--     print("======================================")
--     print("📥 새 DICOM 인스턴스 저장됨")
--     print("📌 Instance ID (Orthanc 내부 ID): " .. instance_id)

--     -- Fix: 'origin'이 nil이거나 'RequestOrigin'이 없을 경우를 처리
--     local requestOrigin = "알 수 없음"
--     if type(origin) == "table" and origin["RequestOrigin"] ~= nil then
--         requestOrigin = tostring(origin["RequestOrigin"])
--     end
--     print("📌 Origin: " .. requestOrigin)

--     -- StudyInstanceUID를 추출하기 위해 인스턴스 정보 조회
--     -- RestApiGet은 Orthanc Lua에서 제공하는 내부 함수입니다.
--     local instanceInfo = RestApiGet('/instances/' .. instance_id .. '/simplified-tags')
--     local study_uid = instanceInfo["StudyInstanceUID"]


    
--     -- 🧩 추가: Series에서 Study UID 추출 시도
--     if study_uid == nil then
--         local instanceMetadata = RestApiGet('/instances/' .. instance_id)
--         local parentSeriesId = instanceMetadata["ParentSeries"]
--         if parentSeriesId ~= nil then
--             local seriesMetadata = RestApiGet('/series/' .. parentSeriesId)
--             study_uid = seriesMetadata["MainDicomTags"]["StudyInstanceUID"]
--             print("📍 Series에서 Study UID 보완 추출: " .. tostring(study_uid))
--         end
--     end



--     if study_uid ~= nil then
--         -- 🔥 중요: Nginx 프록시 경로와 Python AI 서비스의 /analyze-study/ 엔드포인트에 맞춤
--         -- Orthanc 컨테이너에서 Nginx 컨테이너로 접근 (Docker Compose 네트워크 내 이름 사용)
--         -- 'nginx'는 Docker Compose 파일에 정의된 Nginx 서비스 이름이라고 가정합니다.
--         local aiServiceProxyBaseUrl = "http://nginx:80" -- Nginx 컨테이너의 내부 IP:포트 (외부 노출 포트 아님)

--         -- Nginx의 location /ai-service/ 에 맞춰 경로 접두사 포함
--         local aiServiceUrl = aiServiceProxyBaseUrl .. "/ai-service/analyze-study/" .. study_uid
--         print("🚀 AI 분석 요청 시작 (Study): " .. aiServiceUrl)

--         -- 비동기 POST 요청
--         pcall(function()
--             local response = HttpPost(aiServiceUrl, "{}", {
--                 ["Content-Type"] = "application/json",
--                 timeout = 60  -- 60초 타임아웃
--             })

--             if response ~= nil then
--                 print("✅ AI 분석 요청 성공 - Study UID: " .. study_uid)
--                 print("📨 응답 내용: " .. tostring(response))
--             else
--                 print("❌ AI 분석 요청 실패 (응답 없음) - Study UID: " .. study_uid)
--             end
--         end)
--         print("📤 AI 분석 요청 전송 완료 (비동기, Study)")
--     else
--         print("❌ StudyInstanceUID를 찾을 수 없어 AI 분석 요청 스킵 - Instance ID: " .. instance_id)
--     end

--     print("======================================")
-- end

-- function Initialize()
--     print("🔵 Orthanc AI 자동 분석 스크립트 시작됨")
-- end

-- function Finalize()
--     print("🛑 Orthanc AI 자동 분석 스크립트 종료됨")
-- end

-- auto_analyze.lua
-- Orthanc에서 새 DICOM 인스턴스가 저장될 때 AI 분석을 자동으로 요청하는 스크립트

function OnStoredInstance(instance_id, tags, metadata, origin)
    print("======================================")
    print("📥 새 DICOM 인스턴스 저장됨")
    print("📌 Instance ID (Orthanc 내부 ID): " .. instance_id)

    -- Origin 정보 처리
    local requestOrigin = "알 수 없음"
    if type(origin) == "table" and origin["RequestOrigin"] ~= nil then
        requestOrigin = tostring(origin["RequestOrigin"])
    end
    print("📌 Origin: " .. requestOrigin)

    local study_uid = nil

    -- 🔍 StudyInstanceUID 추출 (가장 안정적인 방법)
    print("🔍 직접 전달된 tags에서 StudyInstanceUID 추출 시도")
    if tags ~= nil and tags["StudyInstanceUID"] ~= nil then
        study_uid = tags["StudyInstanceUID"]
        print("✅ 직접 tags에서 Study UID 추출: " .. tostring(study_uid))
    else
        print("❌ 직접 tags에서 StudyInstanceUID 찾을 수 없음")
        
        -- 🔍 대안 방법: simplified-tags API 사용
        print("🔍 방법 2: simplified-tags API 사용")
        pcall(function()
            local instanceInfo = RestApiGet('/instances/' .. instance_id .. '/simplified-tags')
            if instanceInfo ~= nil and instanceInfo["StudyInstanceUID"] ~= nil then
                study_uid = instanceInfo["StudyInstanceUID"]
                print("✅ simplified-tags에서 Study UID 추출: " .. tostring(study_uid))
            else
                print("❌ simplified-tags에서도 StudyInstanceUID 찾을 수 없음")
            end
        end)
    end

    -- StudyInstanceUID가 성공적으로 추출된 경우 AI 분석 요청
    if study_uid ~= nil and study_uid ~= "" then
        print("🎯 최종 Study UID: " .. tostring(study_uid))
        
        -- 🚀 AI 서비스에 분석 요청
        local aiServiceUrl = "http://ai-service:5000/analyze-study/" .. study_uid
        print("🚀 AI 분석 요청 시작: " .. aiServiceUrl)

        -- 비동기 POST 요청
        pcall(function()
            local requestBody = '{"study_uid":"' .. study_uid .. '","orthanc_instance_id":"' .. instance_id .. '"}'
            
            local response = HttpPost(aiServiceUrl, requestBody, {
                ["Content-Type"] = "application/json",
                ["Accept"] = "application/json",
                ["User-Agent"] = "Orthanc-AutoAnalysis/1.0",
                timeout = 120  -- AI 분석 시간을 고려하여 2분 타임아웃
            })

            if response ~= nil then
                print("✅ AI 분석 요청 성공 - Study UID: " .. study_uid)
                print("📨 AI 서비스 응답: " .. tostring(response))
            else
                print("❌ AI 분석 요청 실패 (응답 없음) - Study UID: " .. study_uid)
            end
        end)
        
        print("📤 AI 분석 요청 전송 완료 (비동기)")
        
    else
        print("❌ StudyInstanceUID를 찾을 수 없어 AI 분석 요청 스킵 - Instance ID: " .. instance_id)
        
        -- 디버깅을 위한 추가 정보 출력
        print("🔍 디버깅 정보:")
        if tags ~= nil then
            print("📋 사용 가능한 tags 목록:")
            for key, value in pairs(tags) do
                print("  - " .. tostring(key) .. ": " .. tostring(value))
            end
        else
            print("📋 tags가 nil입니다")
        end
    end

    print("======================================")
end

-- Orthanc 시작 시 호출되는 함수
function Initialize()
    print("🔵 Orthanc AI 자동 분석 스크립트 시작됨")
    print("🔗 AI 서비스 연결: http://ai-service:5000")
    print("📋 지원 기능:")
    print("  - 새 DICOM 인스턴스 자동 감지")
    print("  - StudyInstanceUID 기반 AI 분석 요청")
    print("  - 비동기 처리로 Orthanc 성능 영향 최소화")
end

-- Orthanc 종료 시 호출되는 함수
function Finalize()
    print("🛑 Orthanc AI 자동 분석 스크립트 종료됨")
end