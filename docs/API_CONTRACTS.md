# API Contracts

## core-api

### `POST /uploads/presigned-url`

업로드용 S3 Presigned URL을 발급합니다.

Request:

```json
{
  "content_type": "audio/webm"
}
```

Response:

```json
{
  "upload_url": "https://...",
  "s3_key": "uploads/2026/04/27/uuid.webm",
  "expires_in": 900
}
```

---

### `POST /recommendations/by-timbre`

업로드된 오디오를 기준으로 음색 유사 곡을 조회합니다.

Request:

```json
{
  "s3_key": "uploads/2026/04/27/uuid.webm",
  "timbre_label": "warm",
  "top_k": 10
}
```

Response:

```json
{
  "query": {
    "timbre_label": "warm",
    "top_k": 10
  },
  "items": [
    {
      "id": "f89a5c54-3d73-47d4-8a3f-8f5c30960e42",
      "title": "Song A",
      "artist": "Artist A",
      "timbre_label": "warm",
      "similarity": 0.9231
    }
  ]
}
```

## inference-api

### `POST /embed`

S3 오디오 입력으로부터 512차원 임베딩을 생성합니다.

Request (option 1):

```json
{
  "bucket": "song4u-audio-prod",
  "key": "uploads/2026/04/27/uuid.webm"
}
```

Request (option 2):

```json
{
  "presigned_get_url": "https://..."
}
```

Response:

```json
{
  "embedding": [0.0021, -0.113, 0.0042]
}
```

> 실제 응답에서 `embedding` 길이는 항상 512여야 합니다.

## Error Shape (권장)

```json
{
  "error": {
    "code": "EMBEDDING_TIMEOUT",
    "message": "Inference request timed out",
    "request_id": "req_..."
  }
}
```

## Update Log

- 2026-04-27: core-api / inference-api 초기 계약 정의
