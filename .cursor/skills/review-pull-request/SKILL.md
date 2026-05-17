---
name: review-pull-request
description: Review a GitHub pull request — analyze diff, run checks, post review comments, and merge when approved. Use when the user types /review-pull-request or asks to review, approve, or merge a PR.
disable-model-invocation: true
---

# /review-pull-request

GitHub PR을 리뷰하고, 문제 없으면 사용자 승인을 받아 머지합니다.

## Workflow

```
- [ ] 1. 리뷰 대상 PR 결정
- [ ] 2. PR 정보 / 체크 / diff 수집
- [ ] 3. 코드 리뷰 분석
- [ ] 4. CI 상태 확인
- [ ] 5. 리뷰 결과 보고 + 사용자 결정 요청
- [ ] 6. (승인 시) gh pr review --approve
- [ ] 7. (머지 시) gh pr merge
- [ ] 8. 결과 보고
```

## Step 1 — 리뷰 대상 PR 결정

사용자가 PR 번호/URL을 지정했으면 그것을 사용합니다.
지정하지 않았으면 현재 브랜치의 PR을 사용:

```bash
gh pr view --json number,url,title,headRefName,baseRefName
```

PR이 없으면 중단하고 안내합니다.

## Step 2 — PR 정보 수집

```bash
gh pr view <PR> --json number,title,body,author,headRefName,baseRefName,state,mergeable,mergeStateStatus,reviewDecision,isDraft
gh pr checks <PR>
gh pr diff <PR>
gh pr view <PR> --comments
```

## Step 3 — 코드 리뷰 분석

diff를 분석해 아래 카테고리별로 항목을 정리합니다.

### 리뷰 카테고리

| 심각도 | 라벨 | 기준 |
|--------|------|------|
| 🔴 Critical | 머지 차단 | 버그, 보안 취약점, 데이터 손실, 빌드 깨짐 |
| 🟡 Suggestion | 개선 권장 | 가독성, 성능, 네이밍, 중복 코드 |
| 🟢 Nit | 선택 사항 | 스타일, 사소한 개선 |
| ✅ Praise | 잘한 점 | 좋은 패턴, 명확한 설계 |

### 체크 포인트

- **정확성**: 로직 오류, 엣지 케이스 (null, 빈 배열, 동시성)
- **보안**: SQL 인젝션, XSS, 인증/권한, 비밀 노출
- **테스트**: 변경 사항에 대응하는 테스트 존재 여부
- **타입 안정성**: `any`, 무리한 단언, 누락된 가드
- **React/Next.js**: 훅 규칙, 의존성 배열, Server/Client Component 구분
- **성능**: 불필요한 리렌더, N+1, 큰 번들 임포트
- **일관성**: 프로젝트 네이밍/구조 컨벤션

## Step 4 — CI 상태 확인

`gh pr checks` 결과:
- 모두 ✅ → 진행
- ❌ 실패 있음 → 리뷰 결과에 명시하고, 머지 불가 표시

## Step 5 — 리뷰 결과 보고

아래 형식으로 사용자에게 보고합니다.

```
## PR 리뷰: #<번호> <제목>

작성자: <author>
브랜치: <head> → <base>
상태:   <state> / mergeable=<status> / CI=<pass|fail>

### 🔴 Critical (<N>건)
- `path/file.ts:42` — <문제 설명 + 제안>

### 🟡 Suggestion (<N>건)
- `path/file.tsx:88` — <개선 제안>

### 🟢 Nit (<N>건)
- ...

### ✅ Praise
- <잘한 부분>

### 종합 의견
<2-3문장 요약>

### 다음 액션
- [ ] Approve (Critical 0건일 때)
- [ ] Request changes (Critical 있을 때)
- [ ] Merge (Approve 후, 사용자 확인 후)
```

리뷰 결과를 출력한 뒤 **반드시 사용자에게 다음 행동을 묻습니다**:
- Approve만 할지
- Request changes 코멘트를 남길지
- Approve + Merge까지 할지

## Step 6 — Approve / Request changes

사용자가 승인을 결정하면:

```powershell
$body = @"
<리뷰 본문 — 종합 의견과 카테고리별 항목>
"@
$body | Out-File -FilePath .review-body.md -Encoding utf8
gh pr review <PR> --approve --body-file .review-body.md
Remove-Item .review-body.md
```

Critical 이슈가 있어 변경 요청을 보낼 때:

```powershell
gh pr review <PR> --request-changes --body-file .review-body.md
```

## Step 7 — Merge

사용자가 머지를 명시적으로 승인한 경우에만 실행합니다.

### 머지 전 최종 점검

```bash
gh pr view <PR> --json mergeable,mergeStateStatus,reviewDecision
```

- `mergeable` != `MERGEABLE` → 충돌. 사용자에게 알리고 중단
- `reviewDecision` != `APPROVED` → 경고 후 사용자 재확인
- CI 실패 → 경고 후 사용자 재확인

### 머지 방식 결정

사용자가 지정하지 않았으면 기본은 **squash**:

```bash
gh pr merge <PR> --squash --delete-branch
```

| 옵션 | 사용 시점 |
|------|-----------|
| `--squash` | 기본. 커밋을 하나로 합쳐 깔끔한 히스토리 |
| `--merge` | 머지 커밋 유지 |
| `--rebase` | 선형 히스토리 필요 시 |

`--delete-branch`로 머지 후 원격 브랜치 정리.

## Step 8 — 결과 보고

```
## Merge 결과

PR:    #<번호> — <제목>
방식:  squash / merge / rebase
브랜치 삭제: ✅
URL:   <pr url>
```

## 주의 사항

- **사용자 확인 없이 절대 머지하지 않습니다.** Step 5에서 반드시 사용자 결정을 받습니다.
- `--admin` 플래그로 보호 규칙을 우회하지 않습니다 (사용자가 명시적으로 요청하지 않는 한).
- 본인이 작성한 PR은 셀프 approve가 금지될 수 있으므로 그 경우 안내만 하고 머지 단계로 넘어갑니다.
- draft PR은 머지 불가 — 안내 후 중단합니다.
