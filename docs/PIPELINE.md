# End-to-End Pipeline

## 목적

사용자 녹음 오디오를 기반으로 음색 유사 노래를 추천하는 전체 흐름을 정의합니다.

## High-Level Flow

1. Frontend가 `core-api`에 업로드용 Presigned URL 요청
2. Frontend가 오디오 파일을 S3에 직접 업로드
3. Frontend가 `core-api`에 검색 요청(`s3_key`, `timbre_label`, `top_k`)
4. `core-api`가 `inference-api`를 호출해 512D 임베딩 획득
5. `core-api`가 PostgreSQL(pgvector)에서 유사도 검색
6. `core-api`가 추천 결과를 Frontend에 반환

## Sequence (Detailed)

### 1) Presigned URL 발급
- Client -> `POST /uploads/presigned-url` (`core-api`)
- Response: 업로드 URL, object key, 만료 시간

### 2) S3 Direct Upload
- Client -> S3 (PUT)
- 업로드 완료 후 object key 보관

### 3) Search Request
- Client -> `POST /recommendations/by-timbre`
- Payload: `s3_key`, `timbre_label`, `top_k`

### 4) Inference
- `core-api` -> `inference-api /embed`
- Input: S3 bucket/key 또는 presigned GET URL
- Output: `embedding[512]`

### 5) Vector Similarity Query
- `WHERE timbre_label = :timbre_label`
- `ORDER BY embedding_vector <=> :embedding::vector`
- `LIMIT :top_k`

### 6) Response
- 추천 곡 목록(제목/아티스트/유사도) 반환

## Failure Handling

- S3 업로드 실패: URL 재발급 또는 재시도 가이드 반환
- Inference 타임아웃: 504/재시도 가능 상태코드 반환
- Embedding shape mismatch: 422로 검증 실패 처리
- DB 오류: 추적 가능한 요청 ID 포함한 500 반환

## Observability

- 공통 `request_id`를 core-api -> inference-api -> DB 쿼리 로그에 전파
- 주요 지표:
  - presigned URL 발급 시간
  - inference latency (P50/P95/P99)
  - vector query latency
  - end-to-end recommendation latency

## Update Log

- 2026-04-27: 초기 파이프라인 정의 및 실패/관측 항목 추가
