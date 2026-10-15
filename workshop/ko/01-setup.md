# 파트 1: 설정 및 컨텍스트 엔지니어링(Context Engineering)

---

이 파트에서는 개발 환경을 설정하고 Copilot이 코드베이스를 이해하도록 안내합니다. 그러면 이후 프롬프트를 작성할 때마다 적절한 맥락을 바탕으로 작업할 수 있습니다.

## 섹션 1: 초기 설정

### 1단계: 저장소 만들기

1. [github.com/copilot-dev-days/mona-mayhem](https://github.com/copilot-dev-days/mona-mayhem)을 엽니다.
2. 다음 방법 중 하나로 저장소를 만듭니다.
   - **Use this template** → **Create a new repository**를 클릭하거나
   - 저장소를 포크합니다.
3. 저장소 이름을 `my-mona-mayhem`으로 지정하고, 템플릿에서 만들었다면 공개 범위를 **Public**으로 설정합니다.

<!-- track:vscode:start -->
### 2단계: 개발 환경 선택

#### 옵션 A: 로컬 VS Code

1. VS Code를 열고 **Git: Clone** → **Clone from GitHub**를 실행합니다.
2. `my-mona-mayhem` 저장소를 선택합니다.
3. 메시지가 표시되면 **recommended extensions**를 설치합니다.

#### 옵션 B: GitHub Codespaces

1. GitHub에서 저장소를 엽니다.
2. **Code** → **Codespaces** → **Create codespace on main**을 클릭합니다.
3. 환경이 시작되고 종속성이 설치될 때까지 기다립니다.

### 3단계: 종속성을 설치하고 앱 실행

1. 저장소에서 통합 터미널을 엽니다.
2. 종속성을 설치합니다.

   ```bash
   npm install
   ```

3. 앱을 시작합니다.

   ```bash
   npm run dev
   ```

> ✅ **브라우저에서 앱이 실행됩니다!**
<!-- track:vscode:end -->

<!-- track:cli:start -->
### 2단계: GitHub Copilot CLI 설치

사용 중인 컴퓨터에 맞는 설치 방법을 선택합니다.

- **npm(여러 플랫폼 지원, Node.js 22+ 필요)**

  ```bash
  npm install -g @github/copilot
  ```

- **Homebrew(macOS/Linux)**

  ```bash
  brew install copilot-cli
  ```

- **WinGet(Windows)**

  ```bash
  winget install GitHub.Copilot
  ```

### 3단계: 앱을 시작하고 CLI 인증

1. 저장소를 로컬에 복제하고 프로젝트 루트에서 터미널을 엽니다.
2. 종속성을 설치하고 앱을 시작합니다.

   ```bash
   npm install
   npm run dev
   ```

3. 같은 저장소에서 **두 번째 터미널**을 열고 Copilot CLI를 시작합니다.

   ```bash
   copilot
   ```

4. 대화형 세션에 다음을 입력합니다.

   ```
   /login
   ```

5. 디바이스 인증 안내에 따라 진행한 다음, CLI에서 승인을 요청하면 저장소를 신뢰한다고 확인합니다.

> ✅ **한 터미널에서는 앱 미리 보기를, 다른 터미널에서는 Copilot CLI를 사용할 수 있습니다.**
<!-- track:cli:end -->

## 섹션 2: 컨텍스트 엔지니어링

컨텍스트 엔지니어링은 AI가 코드베이스를 이해하도록 돕는 방법입니다. 맥락을 잘 제공할수록 이후 응답의 품질도 좋아집니다.

<!-- track:vscode:start -->
### 작업 1: /init으로 워크스페이스 지침 생성

Copilot용 워크스페이스 지침 파일을 만들기 위해 기본 제공 `/init` 명령을 사용합니다.

1. **Copilot Chat**을 열고 다음을 입력합니다.

   ```
   /init 프로젝트 개요, 빌드/개발 명령, Astro 모범 사례를 포함하는 간단한 지침을 작성합니다(워크숍은 무시).
   ```

2. 생성된 파일을 확인합니다. Copilot이 프로젝트를 분석하고 `.github/copilot-instructions.md`를 만듭니다.
3. 변경 내용을 적용한 다음 지침 파일을 **커밋**합니다.

> **결과:** 이후 Copilot에 요청할 때마다 워크스페이스 안내가 자동으로 제공됩니다.

### 작업 2: 백그라운드 에이전트

**로컬 백그라운드 에이전트:**

1. 채팅 패널에서 새 채팅을 열려면 **+**를 클릭합니다.
2. 창 아래쪽에서 **Local**이 **Copilot CLI**로 바뀌는 것을 확인합니다.
3. 다음 프롬프트를 입력합니다.

   > "사용하지 않는 변수에 대한 린트 규칙을 추가하고 코드 스타일을 개선한 뒤, 오류를 수정합니다."

4. 작업이 끝나면 변경 내용을 **Review and Apply**로 검토하고 적용합니다. 원한다면 세션을 보관합니다.

**클라우드 에이전트:**

1. 채팅 패널에서 새 채팅을 열려면 **+**를 클릭합니다.
2. 창 아래쪽에서 **Local**이 **Cloud**로 바뀌는 것을 확인합니다.

   > "README를 더 매력적인 랜딩 페이지로 개선합니다."

> **결과:** 편집기를 벗어나지 않고 린트 규칙을 추가하고, 오류를 수정하고, README를 개선했습니다.

### 작업 3: 프로젝트 탐색

**Ask 모드**에서 **Copilot Chat**을 열고 다음 프롬프트를 사용해 봅니다.

- `"Explain the architecture of this project"`
- `"What files are in the src directory and what do they do?"`
- `"What would I need to build to make the Battle button work?"`

> 💡 더 정확한 답변을 원하면 **@workspace**를 사용해 프로젝트 전체 맥락을 Copilot에 제공합니다.
<!-- track:vscode:end -->

<!-- track:cli:start -->
### 작업 1: /init으로 저장소 지침 생성

`/init`으로 Copilot용 워크스페이스 지침 파일을 만듭니다.

1. Copilot CLI에 다음을 입력합니다.

   ```
   /init 프로젝트 개요, 빌드/개발 명령, Astro 모범 사례를 포함하는 간단한 지침을 작성합니다(워크숍은 무시).
   ```

2. 생성된 파일을 확인합니다. Copilot이 프로젝트를 분석하고 `.github/copilot-instructions.md`를 만듭니다.
3. 지침 파일을 커밋합니다.

> **결과:** 이후 CLI 세션은 `.github/copilot-instructions.md`의 저장소별 지침을 자동으로 적용합니다.

### 작업 2: CLI 환경 조정

이후 단계를 더 원활하게 진행할 수 있도록 CLI 제어 기능을 사용해 봅니다.

1. 사용 가능한 슬래시 명령을 살펴보려면 `/help`를 실행합니다.
2. 사용할 수 있는 모델을 확인하려면 `/model`을 사용합니다.
3. 실험 중 승인 항목이 너무 많이 쌓였다면 다음 명령으로 초기화합니다.

   ```
   /reset-allowed-tools
   ```

4. 저장소가 상위 디렉터리 안에 있다면 `/add-dir PATH`로 허용된 워크스페이스 범위를 명시적으로 넓힙니다.

> 💡 CLI 문서에서는 Copilot이 빠르고 예측 가능하게 작동하도록 간결한 사용자 지정 지침과 명시적인 도구 권한을 권장합니다.

### 작업 3: 터미널에서 프로젝트 탐색

Copilot CLI에서 다음 프롬프트를 사용해 봅니다.

- `Give me an overview of this project.`
- `@src/pages/api/contributions/[username].ts What is this file for and what needs to be built here?`
- `@src/pages/index.astro What exists here and what would I need to add to build the battle page?`

대화형 세션을 열지 않고 한 번에 답변을 받으려면 다음을 실행합니다.

```bash
copilot -p "Summarize the architecture of this repo in 5 bullet points"
```

> **결과:** 지침과 명령 사용법을 익히고, 파일을 Copilot CLI 컨텍스트에 제공하는 방법을 배웠습니다.
<!-- track:cli:end -->

## ✅ 파트 1 완료

다음 내용을 익혔습니다.

- 저장소와 로컬 개발 환경 **설정**
- Copilot이 프로젝트와 디자인 방향을 이해하도록 `/init`으로 **지침 생성**
- 생성된 변경 내용을 적용하기 전에 **검토하는 습관 형성**
- 맥락이 풍부한 프롬프트로 **코드베이스 탐색**
