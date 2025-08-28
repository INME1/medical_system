import pydicom
from pydicom.dataset import Dataset, FileDataset
from pydicom.uid import generate_uid
import tempfile
import os
from datetime import datetime

# 기본 DICOM 데이터셋 생성
ds = Dataset()

# 🔥 필수 태그들 (이것들이 누락되면 업로드 실패)
ds.PatientName = "TEST^PATIENT^001"
ds.PatientID = "TEST001"
ds.PatientBirthDate = "19900101"
ds.PatientSex = "M"

# Study 정보
ds.StudyInstanceUID = generate_uid()
ds.StudyDate = datetime.now().strftime('%Y%m%d')
ds.StudyTime = datetime.now().strftime('%H%M%S')
ds.StudyDescription = "Test Study"
ds.AccessionNumber = "ACC001"

# Series 정보
ds.SeriesInstanceUID = generate_uid()
ds.SeriesNumber = "1"
ds.Modality = "CR"
ds.SeriesDescription = "Test Series"

# Instance 정보 (🔥 핵심: SOPInstanceUID 반드시 필요)
ds.SOPInstanceUID = generate_uid()
ds.SOPClassUID = "1.2.840.10008.5.1.4.1.1.1.1"  # CR Image Storage
ds.InstanceNumber = "1"

# 이미지 정보 (간단한 흑백 이미지)
ds.Rows = 512
ds.Columns = 512
ds.BitsAllocated = 8
ds.BitsStored = 8
ds.HighBit = 7
ds.PixelRepresentation = 0
ds.SamplesPerPixel = 1
ds.PhotometricInterpretation = "MONOCHROME2"

# 더미 픽셀 데이터 (512x512 회색 이미지)
import numpy as np
pixel_array = np.full((512, 512), 128, dtype=np.uint8)
ds.PixelData = pixel_array.tobytes()

# 메타 정보 (🔥 중요: 없으면 업로드 실패할 수 있음)
ds.file_meta = Dataset()
ds.file_meta.MediaStorageSOPClassUID = ds.SOPClassUID
ds.file_meta.MediaStorageSOPInstanceUID = ds.SOPInstanceUID
ds.file_meta.TransferSyntaxUID = pydicom.uid.ExplicitVRLittleEndian
ds.file_meta.ImplementationClassUID = generate_uid()
ds.file_meta.ImplementationVersionName = "TEST_DICOM_1.0"

# 파일 저장
filename = "valid_test_dicom.dcm"
ds.save_as(filename, write_like_original=False)

print(f"✅ 유효한 DICOM 파일 생성: {filename}")
print(f"파일 크기: {os.path.getsize(filename)} bytes")

# 생성된 파일 검증
try:
    verify_ds = pydicom.dcmread(filename)
    print(f"✅ DICOM 파일 검증 성공")
    print(f"Patient ID: {verify_ds.PatientID}")
    print(f"Study UID: {verify_ds.StudyInstanceUID}")
    print(f"Series UID: {verify_ds.SeriesInstanceUID}")
    print(f"SOP Instance UID: {verify_ds.SOPInstanceUID}")
except Exception as e:
    print(f"❌ DICOM 파일 검증 실패: {e}")
