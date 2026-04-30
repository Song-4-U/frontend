# components/

React 컴포넌트를 모아두는 곳입니다.

## 분류

| 하위 폴더 | 용도 |
|----------|------|
| `ui/` | shadcn/ui로 추가한 디자인 시스템 컴포넌트 (Button, Card, Input 등) |
| (root) | 도메인 컴포넌트 (RecorderPanel, UploadProgress, RecommendationList 등) |

## 작성 규칙

- 파일명/컴포넌트명은 `PascalCase`
- `ui/` 컴포넌트는 직접 수정해도 OK (shadcn 철학)
- 도메인 컴포넌트는 `lib/store/*` zustand store 또는 `hooks/use-*` 훅을 통해서만 상태 접근
- 한 파일 = 한 컴포넌트 원칙 (작은 sub-component는 같은 파일에 둘 수 있음)
