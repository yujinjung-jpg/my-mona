# 🎮 Mona Mayhem — GitHub Copilot 워크숍

---

> **소요 시간:** 약 1시간<br>
> **수준:** 중급<br>
> **기술 스택:** Astro / Node.js / TypeScript

레트로 아케이드 스타일의 GitHub 기여도 비교 앱인 **Mona Mayhem**을 만들며 GitHub Copilot 워크플로 전반을 익힙니다. 이 워크숍은 VS Code 트랙과 GitHub Copilot CLI 트랙, 두 가지로 진행됩니다.

---

## 🎯 트랙 선택

- **VS Code 트랙** — 편집기 안에서 채팅(Chat), 계획 모드(Plan Mode), 에이전트 모드(Agent Mode), 백그라운드 에이전트, 기본 제공 검토 흐름을 실습합니다.
- **CLI 트랙** — 터미널에서 `copilot`, `@file` 컨텍스트, `/plan`, 자율 편집, `/fleet`, `/delegate`, `/review`를 실습합니다.

선호하는 작업 흐름에 맞는 트랙을 선택하십시오.

---

## 📋 빠른 점검 목록

시작하기 전에 다음 항목을 확인하십시오.

- [ ] 계정에서 GitHub Copilot을 사용할 수 있습니다.
- [ ] Node.js가 설치되어 있습니다.
- [ ] Git이 설치되어 설정되었습니다.
- [ ] 브라우저와 터미널을 모두 사용할 수 있습니다.

<!-- track:vscode:start -->
- [ ] VS Code **v1.107+**(보류 중인 업데이트 없음)
- [ ] **GitHub Copilot** 확장에 로그인했습니다.
- [ ] 채팅 패널을 열었고 Agent를 사용할 준비가 되었습니다.
<!-- track:vscode:end -->

<!-- track:cli:start -->
- [ ] GitHub Copilot CLI를 설치했고 `copilot` 명령을 사용할 수 있습니다.
- [ ] CLI에서 `/login`으로 인증했습니다.
- [ ] `/help`, `/plan`, `/review` 같은 슬래시 명령을 사용할 수 있습니다.
<!-- track:cli:end -->

> 💡 **팁:** VS Code에서 빠르게 시작하려면 미리 구성된 환경인 DevContainer를 사용하십시오.

---

## 🧠 배울 내용

| # | 기술 | 설명 |
|---|-------|-------------|
| 1 | **컨텍스트 엔지니어링(Context Engineering)** | 지침, 참조 자료, 명확한 제약을 통해 Copilot이 코드베이스를 이해하도록 합니다. |
| 2 | **계획 우선(Plan First)** | 구현에 앞서 아키텍처 계획을 작성합니다. |
| 3 | **에이전트 기반 구현(Agentic Implementation)** | 감독하면서 Copilot이 여러 단계로 이루어진 코딩 작업을 수행하도록 합니다. |
| 4 | **반복적 디자인(Iterative Design)** | Copilot으로 시각적 요소를 바꾸고 상호작용 세부 사항을 다듬습니다. |
| 5 | **병렬 워크플로(Parallel Workflows)** | 에이전트, 세션 또는 위임 작업에 업무를 분담합니다. |

<!-- track:vscode:start -->
### VS Code 주요 기능

- 탐색을 위한 **채팅 + Ask 모드**
- 아키텍처 및 디자인 프롬프트를 위한 **계획 모드**
- 여러 파일을 구현하기 위한 **에이전트 모드**
- 작업을 병렬로 다듬기 위한 **백그라운드 및 클라우드 에이전트**
<!-- track:vscode:end -->

<!-- track:cli:start -->
### Copilot CLI 주요 기능

- `copilot`을 사용한 **대화형 CLI 세션**
- 구조화된 계획 수립을 위한 **`/plan` 및 Shift+Tab**
- 인라인 승인과 `/diff`를 활용한 **자율 편집**
- 병렬 처리와 품질 검증을 위한 **`/fleet`, `/delegate`, `/review`**
<!-- track:cli:end -->

---

## 📚 실습 파트

| 파트 | 제목 | 설명 |
|------|-------------|-------------|
| [**01**](01-setup.md) | 설정 및 컨텍스트 엔지니어링 | 저장소를 만들고 환경을 준비한 뒤 Copilot에 적절한 맥락을 제공합니다. |
| [**02**](02-plan-and-scaffold.md) | 계획 및 스캐폴딩(scaffolding) | 구현 전에 API와 페이지 아키텍처를 설계합니다. |
| [**03**](03-agent-mode.md) | 게임 구현 | 에이전트의 도움을 받아 배틀 페이지와 기여도 그래프를 연결합니다. |
| [**04**](04-design-vibes.md) | 디자인 우선 테마 구성 | 기본 구조를 레트로 아케이드 경험으로 바꿉니다. |
| [**05**](05-polish.md) | 다듬기 및 병렬 작업 | 다중 에이전트 워크플로를 활용해 UX, 복원력, 품질을 개선합니다. |
| [**06**](06-bonus.md) | 보너스 및 확장 기능 | 자유 과제, 공유 워크플로, 추가 실험을 살펴봅니다. |

---

## 💡 유용한 팁

1. **브라우저를 열어 두십시오** — 코드를 작성하면서 실시간 업데이트를 확인할 수 있습니다.
2. **자주 커밋하십시오** — 반복 작업 중에도 깔끔한 체크포인트를 저장하십시오.
3. **구현 전에 계획을 다듬으십시오** — 계획을 잘 세울수록 결과도 좋아집니다.
4. **Copilot이 변경한 내용을 검토하십시오** — 무작정 적용하지 말고 diff 보기나 CLI 검토 도구를 사용하십시오.

<!-- track:vscode:start -->
5. 반복 작업이 원하는 대로 진행되지 않으면 채팅에서 체크포인트와 Undo를 사용하십시오.
<!-- track:vscode:end -->

<!-- track:cli:start -->
5. 작업을 살펴보거나 보존하려면 `/session`, `/context`, `/share file`을 사용하십시오.
<!-- track:cli:end -->
