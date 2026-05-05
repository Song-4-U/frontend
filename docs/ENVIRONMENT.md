# Environment Variables Guide

## 원칙

- 비밀값은 `.env`에만 저장하고 레포에는 커밋하지 않습니다.
- 레포에는 `.env.example`만 두고, 모든 필수 키를 문서화합니다.
- 루트/서비스별로 범위를 분리해 최소 권한 원칙을 지킵니다.

## Root `.env.example` (공통 참조)

```env
APP_ENV=local
AWS_REGION=ap-northeast-2
S3_BUCKET=song4u-audio-dev
```

## `core-api/.env.example`

```env
NODE_ENV=development
PORT=8080

DATABASE_URL=postgresql://user:pass@localhost:5432/song4u

AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=song4u-audio-dev

INFERENCE_API_URL=https://example.lambda-url.aws
INFERENCE_API_KEY=

JWT_SECRET=
JWT_EXPIRES_IN=7d
```

## `inference-api/.env.example`

```env
APP_ENV=development
PORT=8000

AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=song4u-audio-dev

ONNX_MODEL_PATH=/opt/models/timbre_encoder.onnx
INFERENCE_TIMEOUT_SEC=20
```

## `frontend/.env.example`

```env
NEXT_PUBLIC_CORE_API_BASE_URL=http://localhost:8080
```

## 운영 권장사항

- 로컬/스테이징/프로덕션 `.env`를 완전히 분리
- 장기적으로는 AWS Secrets Manager 또는 SSM Parameter Store 사용
- 키 순환(rotation) 정책 수립

## Update Log

- 2026-04-27: 초기 환경변수 템플릿 및 운영 원칙 문서화
