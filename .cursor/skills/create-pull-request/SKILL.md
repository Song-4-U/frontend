---
name: create-pull-request
description: Create a GitHub pull request from the current branch. Verifies code, pushes commits, generates PR title and body from the commit history and diff, then opens the PR via gh CLI. Use when the user types /create-pull-request or asks to open/create a PR.
disable-model-invocation: true
---

# /create-pull-request

현재 브랜치의 변경 사항으로 GitHub PR을 생성합니다.

## Workflow

```
- [ ] 1. 사전 점검 (브랜치, 변경 사항, gh CLI)
- [ ] 2. /verify 실행
- [ ] 3. 미커밋 변경 처리 (있으면 /commit-and-push 안내)
- [ ] 4. 원격에 push
- [ ] 5. base 브랜치 결정 및 diff 분석
- [ ] 6. PR 제목/본문 생성
- [ ] 7. gh pr create 실행
- [ ] 8. 결과 보고 (PR URL)
```

## Step 1 — 사전 점검

```bash
git branch --show-current
git status
gh auth status
```

- 현재 브랜치가 `main`/`master`/`develop` 이면 중단하고 사용자에게 새 브랜치를 만들도록 안내합니다.
- `gh auth status`가 실패하면 `gh auth login` 을 실행하라고 안내하고 중단합니다.

## Step 2 — /verify

`.cursor/skills/verify/SKILL.md` 를 읽어 실행합니다. 실패 시 수정 후 재실행합니다.

## Step 3 — 미커밋 변경 처리

`git status`에 미커밋 변경이 있으면:
- 사용자에게 `/commit-and-push` 를 먼저 실행할지 묻습니다.
- 동의하면 해당 스킬을 실행하고, 거부하면 중단합니다.

## Step 4 — 원격 push

```bash
git push -u origin HEAD
```

## Step 5 — base 브랜치 결정 및 diff 분석

기본 브랜치 확인:
```bash
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
```

base와의 diff 및 커밋 목록 수집:
```bash
git fetch origin
git log origin/<base>..HEAD --oneline
git diff origin/<base>...HEAD --stat
git diff origin/<base>...HEAD
```

## Step 6 — PR 제목/본문 생성

### 제목 규칙
- Conventional Commits 형식 (`feat: ...`, `fix: ...` 등)
- 50자 이하, 마침표 없음
- 커밋이 1개면 그 메시지 사용, 여러 개면 변경의 핵심을 요약

### 본문 템플릿

```markdown
## Summary
- <변경의 핵심 1>
- <변경의 핵심 2>
- <변경의 핵심 3>

## Changes
- `path/to/file.ts`: <변경 요약>
- `path/to/other.tsx`: <변경 요약>

## Test Plan
- [ ] /verify 통과 (TypeScript + ESLint + 테스트)
- [ ] <수동 확인 항목 1>
- [ ] <수동 확인 항목 2>

## Notes
<리뷰어가 알아야 할 결정 사항, 트레이드오프, 후속 작업 등 — 없으면 섹션 생략>
```

## Step 7 — PR 생성

PowerShell에서는 heredoc이 동작하지 않으므로 본문을 임시 파일에 쓴 뒤 `--body-file` 옵션을 사용합니다.

```powershell
$body = @"
## Summary
- ...
"@
$body | Out-File -FilePath .pr-body.md -Encoding utf8
gh pr create --base <base> --title "<title>" --body-file .pr-body.md
Remove-Item .pr-body.md
```

draft PR을 원하면 `--draft` 플래그를 추가합니다.

## Step 8 — 결과 보고

```
## PR 생성 결과

브랜치: <head> → <base>
제목:   <title>
URL:    <pr url>
상태:   ✅ Ready / 📝 Draft
```

## 주의 사항

- 절대 `--force` push를 사용하지 않습니다.
- 사용자가 명시적으로 요청하지 않는 한 reviewer/label/assignee를 자동 추가하지 않습니다.
- 비밀 정보가 포함된 파일(`.env`, `*credentials*` 등)이 커밋되어 있으면 PR 생성을 중단하고 사용자에게 경고합니다.
