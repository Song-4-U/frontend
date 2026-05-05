# Timbre Song Recommender Docs

이 디렉토리는 "음색 기반 노래 추천 서비스"의 설계/운영 문서를 관리합니다.

## 문서 목록

- `DB_SCHEMA.md`: PostgreSQL + pgvector 스키마와 인덱스/쿼리 정책
- `PIPELINE.md`: 오디오 업로드부터 추천 반환까지 전체 파이프라인
- `API_CONTRACTS.md`: core-api / inference-api 주요 API 계약
- `ENVIRONMENT.md`: `.env` 변수 정의 및 환경별 운영 원칙

## 업데이트 원칙

- 기능 구현/변경 시, 관련 문서를 같은 변경 단위에서 갱신합니다.
- 변경 이력은 각 문서 하단 "Update Log"에 간단히 기록합니다.
- 스키마/엔드포인트/파이프라인이 바뀌면 문서를 먼저 수정한 뒤 코드에 반영합니다.

## 작업 체크리스트 (문서 관점)

- [ ] DB 스키마 확정 후 `DB_SCHEMA.md` SQL 스냅샷 업데이트
- [ ] API 구현 시 `API_CONTRACTS.md` 요청/응답 예시 실데이터 기반 갱신
- [ ] 인프라 확정 시 `ENVIRONMENT.md` 배포 환경 변수 분리 반영
- [ ] 성능 튜닝 시 `PIPELINE.md` 지연 구간 및 최적화 포인트 반영
