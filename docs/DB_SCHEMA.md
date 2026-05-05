# DB Schema (PostgreSQL + pgvector)

## 개요

본 서비스는 PostgreSQL을 메인 저장소로 사용하고, 음색 임베딩 검색을 위해 `pgvector`를 사용합니다.

## Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Core Table: songs

```sql
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  timbre_label TEXT NOT NULL,
  embedding_vector VECTOR(512) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Index Strategy

```sql
CREATE INDEX IF NOT EXISTS idx_songs_timbre_label
  ON songs (timbre_label);
```

초기 추천 인덱스(코사인 거리 기준):

```sql
CREATE INDEX IF NOT EXISTS idx_songs_embedding_ivfflat
  ON songs USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);
```

> 참고: 대규모 데이터셋에서는 `hnsw`를 고려할 수 있으며, 데이터 볼륨/지연 SLA 기준으로 재평가합니다.

## Similarity Query Example

```sql
SELECT
  id,
  title,
  artist,
  timbre_label,
  1 - (embedding_vector <=> $2::vector) AS similarity
FROM songs
WHERE timbre_label = $1
ORDER BY embedding_vector <=> $2::vector
LIMIT $3;
```

파라미터:
- `$1`: timbre label (TEXT)
- `$2`: query embedding vector (VECTOR(512))
- `$3`: top-k limit (INT)

## Suggested Future Tables

- `users`: 인증/권한 정보
- `search_requests`: 검색 요청 이력 및 디버깅 로그
- `audio_assets`: 업로드 원본(S3 key), 처리 상태, 생성 임베딩 참조

## Migration Notes

- `vector(512)` 차원은 inference 모델 출력과 항상 일치해야 함
- 모델 차원 변경 시 스키마/인덱스/쿼리를 동시에 마이그레이션
- `updated_at` 자동 갱신 트리거는 추후 도입 가능

## Update Log

- 2026-04-27: 초기 스키마 및 유사도 검색/인덱스 전략 문서화
