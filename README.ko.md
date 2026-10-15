🌐 [English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt_BR.md) | 한국어

# 🎮 Mona Mayhem

**VS Code 및 GitHub Copilot CLI 워크숍** — GitHub 기여도 배틀 아레나 만들기

두 사용자의 GitHub 기여 그래프를 비교하는 레트로 아케이드 스타일 웹사이트를 Astro로 만드는 워크숍 템플릿입니다. 이 저장소는 **시작점**이며, GitHub Copilot을 사용해 단계별로 앱을 완성합니다.

![Mona Mayhem 스크린샷](https://github.com/user-attachments/assets/5eca79e2-cb9f-4e93-aa0d-23666ebde3b7)
*워크숍을 마치면 만들 수 있는 결과물*

## 📚 워크숍

워크숍은 두 가지 트랙을 제공합니다. 선호하는 작업 방식에 맞는 트랙을 선택하십시오.

- **VS Code 트랙** — 편집기 안에서 채팅(Chat), 계획 모드(Plan Mode), 에이전트 모드(Agent Mode), 백그라운드 에이전트(Background agents), 편집기 내 검토 흐름을 실습합니다.
- **CLI 트랙** — 터미널에서 `copilot`, `@file` 컨텍스트, `/plan`, 자율 편집, `/fleet`, `/delegate`, `/review`를 실습합니다.

| 파트 | 제목 | Copilot 중점 기능 |
|------|-------|------------------|
| [00](workshop/ko/00-overview.md) | 개요 | 트랙 선택 및 학습 목표 |
| [01](workshop/ko/01-setup.md) | 설정 및 컨텍스트 엔지니어링(Context Engineering) | 지침, 권한, 환경 설정 |
| [02](workshop/ko/02-plan-and-scaffold.md) | 계획 및 스캐폴딩(Scaffolding) | API 및 페이지 아키텍처 계획 |
| [03](workshop/ko/03-agent-mode.md) | 게임 구현 | 에이전트 기반 구현(Agentic implementation) 및 반복 개선 |
| [04](workshop/ko/04-design-vibes.md) | 디자인 우선 테마 구성 | 시각 디자인 계획 및 구현 |
| [05](workshop/ko/05-polish.md) | 다듬기 및 병렬 작업 | 병렬 처리, 검토, 품질 개선 |
| [06](workshop/ko/06-bonus.md) | 보너스 및 확장 기능 | 자유 과제 및 추가 실험 |

## 🚀 빠른 시작

1. 먼저 다음 방법 중 하나로 저장소를 만듭니다.
   - **Use this template**을 클릭해 새 저장소를 만들거나
   - 이 저장소를 포크합니다.
2. 원하는 워크숍 트랙을 선택합니다.
   - **VS Code:** 저장소를 복제하고 VS Code에서 엽니다.
   - **GitHub Copilot CLI:** 저장소를 로컬에 복제하고 `copilot`을 설치한 다음 터미널에서 작업합니다.
3. [워크숍 안내](workshop/ko/00-overview.md)를 따라 진행합니다.

## 사전 준비

### 공통

- GitHub Copilot(Pro, Business 또는 Enterprise)
- Git
- Node.js

### VS Code 트랙

- VS Code v1.107+
- GitHub Copilot 확장에 로그인

### CLI 트랙

- GitHub Copilot CLI(`copilot`)
- `npm install -g @github/copilot`으로 CLI를 설치하려면 Node.js 22+
- 또는 Homebrew나 WinGet 등 원하는 패키지 관리자로 설치

## 기술 스택

- **프레임워크:** [Astro](https://astro.build/) v6
- **런타임:** [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/) 어댑터를 사용하는 Node.js
- **글꼴:** Press Start 2P(레트로 게임 글꼴)
- **API:** GitHub 기여 그래프 API

## 배포 참고 사항

### 현재 GitHub Pages 구성

현재 `.github/workflows/deploy.yml` 워크플로는 `docs/` 및 `workshop/`의 정적 콘텐츠를 GitHub Pages에 배포합니다. `src/`의 Astro 앱을 빌드하거나 배포하지는 않습니다.

### Astro 앱을 GitHub Pages에 배포하려는 경우

GitHub Pages는 정적 호스팅이므로 Astro 앱도 정적 출력을 사용해야 합니다.

1. `astro.config.mjs`의 `output`을 `server`에서 `static`으로 변경합니다.
2. `astro.config.mjs`와 `package.json`에서 Node 어댑터(`@astrojs/node`)를 제거합니다.
3. GitHub Actions 워크플로에서 `npm ci`와 `npm run build`를 실행한 다음, Pages 아티팩트로 `dist/`를 업로드하도록 변경합니다.
4. 프로젝트 페이지(`https://<user>.github.io/<repo>/`)에 배포한다면 `astro.config.mjs`에서 `site`와 `base`를 설정합니다.

프로덕션에서 API 라우트를 계속 실행해야 한다면 GitHub Pages 대신 Vercel, Netlify 또는 Node.js 호스트와 같은 서버 플랫폼을 사용합니다.

## 라이선스

MIT
