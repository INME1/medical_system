// ==================== OHIF Study List OpenMRS 환자 정보 통합 ====================

// 1. 🔥 커스텀 데이터 소스 - OpenMRS 매핑 포함
const enhancedDataSourceConfig = {
  namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
  sourceName: 'dicomweb-with-emr',
  configuration: {
    friendlyName: 'Medical Platform with EMR',
    name: 'orthanc-emr-integrated',
    
    // Orthanc DICOM-Web 엔드포인트
    wadoUriRoot: 'http://35.225.63.41:8042/wado',
    qidoRoot: 'http://35.225.63.41:8042/dicom-web',
    wadoRoot: 'http://35.225.63.41:8042/dicom-web',
    
    // EMR 연동 설정
    emrIntegration: {
      enabled: true,
      apiBaseUrl: 'http://35.225.63.41:8000/api/',
      mappingEndpoint: 'integration/patient-mappings/',
      patientsEndpoint: 'integration/openmrs-patients/'
    },
    
    imageRendering: 'wadors',
    thumbnailRendering: 'wadors',
    enableStudyLazyLoad: true,
    
    requestOptions: {
      timeout: 15000,
      headers: {
        'Authorization': 'Basic b3J0aGFuYzpvcnRoYW5j'
      }
    }
  }
};

// 2. 🏥 OpenMRS 환자 매핑 서비스
class OpenMRSPatientMappingService {
  constructor(apiBaseUrl = 'http://35.225.63.41:8000/api/') {
    this.apiBaseUrl = apiBaseUrl;
    this.patientCache = new Map();
    this.mappingCache = new Map();
  }
  
  // 모든 OpenMRS 환자 + 매핑 정보 가져오기
  async getAllPatientsWithMapping() {
    try {
      const response = await fetch(`${this.apiBaseUrl}integration/openmrs-patients/`);
      const patients = await response.json();
      
      // 캐시에 저장
      patients.forEach(patient => {
        this.patientCache.set(patient.uuid, patient);
        if (patient.orthanc_patient_id) {
          this.mappingCache.set(patient.orthanc_patient_id, patient);
        }
      });
      
      console.log(`✅ OpenMRS 환자 ${patients.length}명 로드됨`);
      return patients;
      
    } catch (error) {
      console.error('❌ OpenMRS 환자 목록 조회 실패:', error);
      return [];
    }
  }
  
  // Orthanc Patient ID로 OpenMRS 환자 정보 찾기
  getPatientByOrthancId(orthancPatientId) {
    return this.mappingCache.get(orthancPatientId);
  }
  
  // OpenMRS UUID로 환자 정보 찾기
  getPatientByUuid(uuid) {
    return this.patientCache.get(uuid);
  }
  
  // Patient ID 매칭 (DICOM Patient ID -> OpenMRS)
  findPatientByDicomId(dicomPatientId) {
    // 캐시에서 매칭되는 환자 찾기
    for (const patient of this.patientCache.values()) {
      // patient_identifier 또는 기타 식별자로 매칭
      if (patient.identifiers?.some(id => id.identifier === dicomPatientId) ||
          patient.patient_identifier === dicomPatientId ||
          patient.orthanc_patient_id === dicomPatientId) {
        return patient;
      }
    }
    return null;
  }
}

// 3. 🎯 OHIF Study List 커스터마이징
const customStudyListConfig = {
  // 컬럼 정의 - OpenMRS 정보 포함
  tableColumns: [
    {
      name: 'PatientName',
      displayText: '환자명',
      fieldName: 'PatientName',
      renderer: ({ cellData, instance }) => {
        // OpenMRS 환자 정보 우선 표시
        const emrPatient = instance.emrPatient;
        if (emrPatient) {
          return emrPatient.display || emrPatient.person?.display || cellData;
        }
        return cellData || 'Unknown';
      }
    },
    {
      name: 'PatientID', 
      displayText: '환자 ID',
      fieldName: 'PatientID',
      renderer: ({ cellData, instance }) => {
        const emrPatient = instance.emrPatient;
        if (emrPatient) {
          // OpenMRS identifier 우선 표시
          const identifier = emrPatient.identifiers?.[0]?.identifier || 
                           emrPatient.patient_identifier ||
                           emrPatient.uuid?.substring(0, 8);
          return identifier || cellData;
        }
        return cellData || 'N/A';
      }
    },
    {
      name: 'StudyDate',
      displayText: '검사 날짜',
      fieldName: 'StudyDate'
    },
    {
      name: 'StudyDescription',
      displayText: '검사 설명', 
      fieldName: 'StudyDescription'
    },
    {
      name: 'Modality',
      displayText: '모달리티',
      fieldName: 'ModalitiesInStudy'
    },
    {
      name: 'AccessionNumber',
      displayText: 'Accession #',
      fieldName: 'AccessionNumber'
    },
    {
      name: 'PatientAge',
      displayText: '나이',
      fieldName: 'PatientAge',
      renderer: ({ cellData, instance }) => {
        const emrPatient = instance.emrPatient;
        if (emrPatient?.person?.birthdate) {
          const birthDate = new Date(emrPatient.person.birthdate);
          const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          return `${age}세`;
        }
        return cellData || 'N/A';
      }
    },
    {
      name: 'PatientSex',
      displayText: '성별',
      fieldName: 'PatientSex',
      renderer: ({ cellData, instance }) => {
        const emrPatient = instance.emrPatient;
        if (emrPatient?.person?.gender) {
          return emrPatient.person.gender === 'M' ? '남성' : '여성';
        }
        return cellData === 'M' ? '남성' : cellData === 'F' ? '여성' : 'N/A';
      }
    }
  ],
  
  // 추가 환자 정보 표시
  expandedRowRenderer: ({ instance }) => {
    const emrPatient = instance.emrPatient;
    if (!emrPatient) return null;
    
    return `
      <div class="expanded-patient-info">
        <div class="info-row">
          <span class="label">OpenMRS UUID:</span>
          <span class="value">${emrPatient.uuid}</span>
        </div>
        <div class="info-row">
          <span class="label">생년월일:</span>
          <span class="value">${emrPatient.person?.birthdate || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">등록일:</span>
          <span class="value">${new Date(emrPatient.auditInfo?.dateCreated || '').toLocaleDateString() || 'N/A'}</span>
        </div>
        ${emrPatient.orthanc_patient_id ? `
        <div class="info-row">
          <span class="label">Orthanc ID:</span>
          <span class="value">${emrPatient.orthanc_patient_id}</span>
        </div>
        ` : ''}
      </div>
    `;
  }
};

// 4. 🔄 데이터 프로세서 - Study 데이터에 OpenMRS 정보 추가
class StudyDataProcessor {
  constructor() {
    this.emrService = new OpenMRSPatientMappingService();
    this.initialized = false;
  }
  
  async initialize() {
    if (!this.initialized) {
      console.log('🔄 OpenMRS 환자 데이터 초기화 중...');
      await this.emrService.getAllPatientsWithMapping();
      this.initialized = true;
      console.log('✅ OpenMRS 환자 데이터 초기화 완료');
    }
  }
  
  // Study 목록에 OpenMRS 환자 정보 병합
  async processStudyList(studies) {
    await this.initialize();
    
    return studies.map(study => {
      // DICOM Patient ID로 OpenMRS 환자 찾기
      const dicomPatientId = study.PatientID;
      const emrPatient = this.emrService.findPatientByDicomId(dicomPatientId);
      
      if (emrPatient) {
        console.log(`✅ 매핑 발견: ${dicomPatientId} -> ${emrPatient.display}`);
        
        // Study 객체에 EMR 환자 정보 추가
        return {
          ...study,
          emrPatient: emrPatient,
          // 우선 순위: OpenMRS > DICOM
          PatientName: emrPatient.display || study.PatientName,
          PatientID: emrPatient.patient_identifier || study.PatientID,
          PatientSex: emrPatient.person?.gender || study.PatientSex,
          PatientBirthDate: emrPatient.person?.birthdate || study.PatientBirthDate,
          // 확장된 환자 정보
          PatientUUID: emrPatient.uuid,
          OrthancPatientID: emrPatient.orthanc_patient_id
        };
      } else {
        console.log(`⚠️ 매핑 없음: ${dicomPatientId}`);
        return {
          ...study,
          emrPatient: null
        };
      }
    });
  }
}

// 5. 🎨 커스텀 Study List 컴포넌트
const EnhancedStudyList = ({ studies, onStudyClick }) => {
  const [processedStudies, setProcessedStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processor] = useState(() => new StudyDataProcessor());
  
  useEffect(() => {
    const processData = async () => {
      setLoading(true);
      try {
        const enhanced = await processor.processStudyList(studies);
        setProcessedStudies(enhanced);
      } catch (error) {
        console.error('Study 데이터 처리 실패:', error);
        setProcessedStudies(studies);
      } finally {
        setLoading(false);
      }
    };
    
    if (studies?.length > 0) {
      processData();
    }
  }, [studies]);
  
  if (loading) {
    return (
      <div className="study-list-loading">
        <div className="loading-spinner"></div>
        <p>환자 정보를 불러오는 중...</p>
      </div>
    );
  }
  
  return (
    <div className="enhanced-study-list">
      <div className="study-list-header">
        <h2>📋 Study List</h2>
        <span className="study-count">{processedStudies.length} Studies</span>
      </div>
      
      <div className="study-table">
        <table>
          <thead>
            <tr>
              <th>환자명</th>
              <th>환자 ID</th>
              <th>검사 날짜</th>
              <th>검사 설명</th>
              <th>모달리티</th>
              <th>나이/성별</th>
              <th>EMR 연동</th>
            </tr>
          </thead>
          <tbody>
            {processedStudies.map((study, index) => (
              <tr 
                key={study.StudyInstanceUID || index}
                onClick={() => onStudyClick(study)}
                className={study.emrPatient ? 'mapped-study' : 'unmapped-study'}
              >
                <td className="patient-name">
                  {study.emrPatient?.display || study.PatientName || 'Unknown'}
                  {study.emrPatient && (
                    <span className="emr-badge">EMR</span>
                  )}
                </td>
                <td>{study.emrPatient?.patient_identifier || study.PatientID || 'N/A'}</td>
                <td>{study.StudyDate || 'N/A'}</td>
                <td>{study.StudyDescription || 'N/A'}</td>
                <td>
                  <span className="modality-badge">
                    {study.ModalitiesInStudy || study.Modality || 'N/A'}
                  </span>
                </td>
                <td>
                  {study.emrPatient ? (
                    <>
                      {study.emrPatient.person?.birthdate && (
                        <span>{calculateAge(study.emrPatient.person.birthdate)}세 </span>
                      )}
                      <span>{study.emrPatient.person?.gender === 'M' ? '남성' : '여성'}</span>
                    </>
                  ) : (
                    <>
                      {study.PatientAge} {study.PatientSex === 'M' ? '남성' : study.PatientSex === 'F' ? '여성' : ''}
                    </>
                  )}
                </td>
                <td>
                  {study.emrPatient ? (
                    <span className="status-connected">✅ 연동됨</span>
                  ) : (
                    <span className="status-disconnected">⚠️ 미연동</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 6. 🎯 OHIF 설정에 통합
const integratedOHIFConfig = {
  ...enhancedDataSourceConfig,
  
  // 커스텀 확장 등록
  extensions: [
    '@ohif/extension-default',
    '@ohif/extension-cornerstone',
    {
      // 커스텀 EMR 통합 확장
      id: 'medical-platform.emr-integration',
      getStudyListModule: () => ({
        component: EnhancedStudyList,
        processor: new StudyDataProcessor()
      })
    }
  ],
  
  // Study List 커스터마이징
  studyListFunctionsEnabled: true,
  customization: {
    studyList: customStudyListConfig
  }
};

// 7. 🛠️ 유틸리티 함수들
const calculateAge = (birthDate) => {
  if (!birthDate) return 'N/A';
  const birth = new Date(birthDate);
  const today = new Date();
  return Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
};

// 8. 📱 통합 CSS 스타일
const enhancedStudyListCSS = `
.enhanced-study-list {
  background: #1a1a1a;
  color: white;
  font-family: 'Segoe UI', sans-serif;
}

.study-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
}

.study-count {
  background: #2196F3;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
}

.study-table table {
  width: 100%;
  border-collapse: collapse;
}

.study-table th {
  background: #2d2d2d;
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #444;
  font-weight: 600;
}

.study-table td {
  padding: 12px;
  border-bottom: 1px solid #333;
}

.study-table tr:hover {
  background: #2d2d2d;
  cursor: pointer;
}

.mapped-study {
  border-left: 3px solid #4CAF50;
}

.unmapped-study {
  border-left: 3px solid #FF9800;
}

.emr-badge {
  background: #4CAF50;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  margin-left: 8px;
}

.modality-badge {
  background: #2196F3;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-connected {
  color: #4CAF50;
  font-weight: 600;
}

.status-disconnected {
  color: #FF9800;
  font-weight: 600;
}

.patient-name {
  font-weight: 600;
  display: flex;
  align-items: center;
}
`;

export {
  enhancedDataSourceConfig,
  OpenMRSPatientMappingService,
  StudyDataProcessor,
  EnhancedStudyList,
  integratedOHIFConfig,
  enhancedStudyListCSS
};