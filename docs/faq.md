# FAQ — 자주 묻는 질문

이 문서는 **처음 듣는 용어도 풀어서** 천천히 설명합니다.  
더 짧은 정의만 필요하면 [용어 쉽게 풀기](glossary.md)를 보세요.

---

## 목차

1. [Geulte는 뭐예요?](#q-what)
2. [서버 컴퓨터가 꼭 필요해요?](#q-server)
3. [Supabase랑 Vercel은 필수인가요?](#q-stack)
4. [GitHub 없으면 못 쓰나요?](#q-github)
5. [글은 어떻게 “업로드”하나요?](#q-upload)
6. [웹에서 글 쓰는 화면(WYSIWYG)은요?](#q-wysiwyg)
7. [Obsidian이랑 어떻게 연결되나요?](#q-obsidian)
8. [검색이랑 필터는 DB가 있어야 하나요?](#q-search-filter)
9. [`geulte sync`는 뭔가요?](#q-sync)
10. [Docker / 컨테이너로 배포해야 하나요?](#q-docker)
11. [npm에 아직 없거나 설치가 안 되면?](#q-npm)
12. [초안은 어떻게 숨기나요?](#q-draft)
13. [OG 이미지가 안 생겨요](#q-og)
14. [플러그인으로 뭐든 할 수 있나요?](#q-plugins)
15. [보안: 키를 어디에 두나요?](#q-secrets)
16. [문제가 생기면 어디를 보나요?](#q-help)

---

<a id="q-what"></a>
## 1. Geulte는 뭐예요?

**한 줄:** Obsidian에서 쓰던 것처럼 마크다운으로 쌓은 글을, **블로그 웹사이트 파일**로 바꿔 주는 도구입니다.

조금 더 풀면:

- 입력: `content/` 폴더의 `.md` 파일들 (위키링크, 태그, 시리즈 …)
- 처리: `geulte build`가 HTML·CSS·RSS·사이트맵 등을 만듦
- 출력: 보통 `dist/` 폴더 → 이것을 인터넷에 올려 사람들이 읽음

워드프레스처럼 “서버에 로그인해 글을 쓰는 프로그램”이라기보다,  
**휴고(Hugo)·일븐티(Eleventy) 같은 정적 사이트 생성기(SSG)** 가족에 가깝습니다.  
Geulte만의 색깔은 Obsidian 풍 문법과 **여러 분류(taxonomy)** 를 한 사이트에서 쓰기 쉽게 맞춘 점입니다.

---

<a id="q-server"></a>
## 2. 서버 컴퓨터가 꼭 필요해요?

**아니요. “항상 켜 둔 내 서버 1대”는 필수가 아닙니다.**

사람들이 “서버”라고 부르는 것을 세 가지로 나누면 헷갈림이 줄어듭니다.

| 종류 | 예시 | Geulte에서 |
| :--- | :--- | :--- |
| **개발용 미리보기** | `npm run dev` | 내 PC에서만, 글 확인할 때만 켬 |
| **상시 앱 서버** | 24시간 Node/Java 프로세스 | **블로그 본문에는 필요 없음** |
| **파일 호스팅** | Vercel, Pages, S3, Nginx 정적 | `dist/` 파일을 방문자에게 전달 |

비유:

- `dev` = 집 거실에서 인테리어 미리보기  
- `build` = 가구를 조립해 상자에 넣기  
- 호스팅 = 상자를 전시장에 두기  

전시장에 **요리사(앱 서버)를 상주**시킬 필요는 없습니다. 이미 완성된 페이지를 보여 주면 됩니다.

조회수·조합 필터 같은 **선택 기능**을 쓰면, Supabase나 Vercel 함수가 “필요할 때만 잠깐” 일합니다.  
그래도 “내가 임대한 Linux 서버를 365일 관리”와는 다른 이야기입니다.

관련: [어떻게 동작하나요](how-it-works.md) · [배포하기](deploy.md)

---

<a id="q-stack"></a>
## 3. Supabase랑 Vercel은 필수인가요?

**필수는 아닙니다.** 공식 문서가 **가장 잘 안내하는 권장 조합**입니다.

### 필수에 가까운 것

1. Node.js로 **빌드**할 수 있는 환경 (내 PC 또는 CI)
2. `dist/`를 올려 줄 **정적 호스팅** (어디든)

### 권장 풀스택 (편하고 문서화됨)

- **Vercel** — 배포가 쉽고, 스캐폴드의 `api/*.js`와 잘 맞음  
- **Supabase** — 조회수·sync·대시보드·프로덕션 필터용 DB  
- **GitHub** — 푸시하면 자동 빌드하도록 잇기 쉬움  

### 없어도 되는 것

- sync  
- 조회수 / `/dashboard`  
- 공개 사이트에서의 조합 필터 API  

이 없이도 **글 읽기, 목록, 다크모드, ⌘K 검색** 같은 핵심은 정적 파일만으로 가능합니다.

정리 표는 [배포하기](deploy.md)의 “한눈에” 섹션과 같습니다.

---

<a id="q-github"></a>
## 4. GitHub 없으면 못 쓰나요?

**쓸 수 있습니다.**

- Geulte 엔진 자체는 GitHub API에 묶여 있지 않습니다.  
- 글은 그냥 폴더의 파일입니다.  
- 배포도 `dist/`만 어디로든 복사하면 됩니다.

다만:

- `geulte init`이 만들어 주는 **자동 배포 워크플로**는 GitHub Actions 전제에 가깝습니다.  
- 댓글(Giscus)을 쓰면 **GitHub Discussions**가 필요합니다.  

즉 **“기본 레시피가 GitHub”** 이지 **“GitHub 없으면 설치 불가”** 가 아닙니다.  
GitLab, 기타 Git 호스트, 심지어 Git 없이 USB로 `dist`를 옮겨도 정적 사이트는 동작합니다.

---

<a id="q-upload"></a>
## 5. 글은 어떻게 “업로드”하나요?

Geulte에는 “업로드” 버튼이 있는 관리자 페이지가 **없습니다.**  
실무에서 “올렸다”고 느끼는 행동은 보통 아래 중 하나입니다.

### A. Git으로 올리기 (가장 흔함)

1. `content/posts/새글.md` 저장  
2. `git add` → `git commit` → `git push`  
3. CI가 `geulte build` 후 호스팅에 배포  

방문자가 보는 사이트는 **새로 빌드된 HTML**이 반영될 때 갱신됩니다.

### B. 직접 빌드해서 올리기

1. 로컬에서 `npm run build`  
2. `dist/` 내용을 FTP, `rsync`, 호스팅 대시보드 업로드 등으로 전송  

### C. `geulte sync`만 실행

이것은 **웹페이지를 새로 만드는 업로드가 아닙니다.**  
마크다운에서 읽은 메타데이터를 Supabase 테이블에 맞추는 작업입니다.  
필터·조회수 쪽을 쓸 때 필요합니다.

---

<a id="q-wysiwyg"></a>
## 6. 웹에서 글 쓰는 화면(WYSIWYG)은요?

**현재 없습니다.** 의도적으로 미룬 영역에 가깝습니다 (CMS·로그인·결제 등).

| 하고 싶은 일 | 지금 방법 |
| :--- | :--- |
| 편하게 쓰기 | Obsidian, VS Code 등 |
| 사이트 모양 확인 | `geulte dev` |
| 방문자에게 공개 | 빌드 + 배포 |

노션이나 티스토리 관리자 화면을 기대하셨다면, Geulte는 **“로컬 파일 우선”** 철학입니다.  
나중에 CMS가 생겨도, 코어 SSG와는 분리되는 쪽이 자연스럽습니다.

---

<a id="q-obsidian"></a>
## 7. Obsidian이랑 어떻게 연결되나요?

특별한 “공식 Obsidian 플러그인으로 원클릭 발행”이 **필수는 아닙니다.**

실무 패턴 예:

1. Obsidian 볼트 경로를 사이트 프로젝트의 `content/` 로 둔다.  
2. 또는 볼트에서 쓴 뒤 `content/posts/`로 복사·동기화한다.  
3. Git 저장소가 볼트이기도 하다.

Geulte는 파일 내용을 **Obsidian이 익숙한 문법으로 해석**해 줍니다 (`[[wikilinks]]`, callout 등).  
연결의 본질은 **같은 폴더의 마크다운 파일**입니다.

미리보기는 Obsidian 렌더와 100% 같지 않을 수 있으니, 공개 전 `geulte dev`로 확인하세요.  
→ [글 작성하기](writing.md)

---

<a id="q-search-filter"></a>
## 8. 검색이랑 필터는 DB가 있어야 하나요?

**검색(⌘K)** 과 **조합 필터(`/posts`)** 는 다릅니다.

### 검색 (MiniSearch)

- 빌드 때 만든 인덱스를 **브라우저**에서 검색합니다.  
- Supabase **없이도** 동작하는 쪽입니다.

### 조합 필터

- 여러 태그·토픽·시리즈를 한꺼번에 고르는 UI입니다.  
- 실제 목록 조회는 `/api/filter` 같은 엔드포인트를 호출합니다.  
- **로컬:** `geulte dev`가 목(mock) API로 도와줄 수 있습니다.  
- **공개 사이트:** 스캐폴드의 Vercel 함수 + (보통) Supabase가 권장 경로입니다.  
- 필터 **패널**은 `database.url`이 없어도 `/posts`에 켜지도록 정리되어 있습니다. API가 없으면 요청만 실패할 수 있습니다.

---

<a id="q-sync"></a>
## 9. `geulte sync`는 뭔가요?

**마크다운 → Supabase 테이블**로 메타데이터를 맞추는 명령입니다.

- 하는 일: 글 목록·백링크 등을 DB에 upsert하고, 사라진 글은 정리  
- 안 하는 일: `dist/` HTML을 새로 만들어 배포  

`geulte build`는 기본적으로 (설정이 있으면) sync도 같이 할 수 있습니다.  
HTML만 다시 뽑고 DB는 건드리고 싶지 않으면 `geulte build --no-sync` 를 쓰세요.

`config.yaml`에 `database`가 없으면 sync는 할 게 없다고 알려 주고 끝납니다.

---

<a id="q-docker"></a>
## 10. Docker / 컨테이너로 배포해야 하나요?

**보통은 아닙니다.** 지금 제품 단계에서는 과한 편입니다.

이유는 단순합니다. 결과물이 **이미 정적 파일**이라서, Docker로 감싸 봐야 결국 Nginx가 폴더를 서빙하는 것과 크게 다르지 않습니다.

컨테이너가 의미 있어지는 예:

- 조직이 “모든 서비스는 쿠버네티스 이미지로만” 배포할 때  
- 빌드 환경을 Docker로 **고정**하고 싶을 때 (배포 자체가 아니라 CI용)

개인 블로그·소규모 문서 사이트에는 정적 호스팅이면 충분합니다.

---

<a id="q-npm"></a>
## 11. npm에 아직 없거나 설치가 안 되면?

프로젝트 버전에 따라 `npx geulte`가 아직 레지스트리에 없을 수 있습니다.  
그럴 때는 저장소를 클론해 로컬 패키지로 쓰거나, `npm pack`으로 만든 `.tgz`를 `file:`로 설치하는 방식을 씁니다.

README의 빠른 시작은 **패키지가 공개된 뒤의 표준 경로**를 기준으로 적혀 있습니다.  
CHANGELOG의 Unreleased / 릴리즈 노트를 함께 확인하세요. → [CHANGELOG](CHANGELOG.md)

---

<a id="q-draft"></a>
## 12. 초안은 어떻게 숨기나요?

프론트매터에 다음을 넣습니다.

```yaml
draft: true
```

빌드할 때 이 글은 **사이트에 포함되지 않습니다.**  
다 쓰면 `false`로 바꾸거나 줄을 지우면 됩니다.

---

<a id="q-og"></a>
## 13. OG 이미지가 안 생겨요

**OG(Open Graph) 이미지**는 카카오톡·트위터 등에 링크를 붙여 넣을 때 보이는 미리보기 그림입니다.

Geulte는 빌드 때 자동 생성을 시도하지만, **폰트 파일**이 필요합니다.

- 패키지 또는 사이트 `public/fonts/NotoSansKR-Bold.ttf`  
- 없으면 **생성을 건너뜁니다** (빌드 전체가 실패하지는 않음)

폰트를 준비한 뒤 다시 빌드해 보세요.

---

<a id="q-plugins"></a>
## 14. 플러그인으로 뭐든 할 수 있나요?

아직은 **훅이 세 개뿐**입니다.

- `onConfig` — 설정 직후  
- `afterScan` — 글 스캔 후  
- `afterGenerate` — 페이지 생성 후  

`beforeParse` / `afterParse` / `beforeRender` 등은 **아직 없습니다.**  
과장된 “모든 생명주기 플러그인”을 기대하시면 실망할 수 있어, README에도 범위를 밝혀 두었습니다.

예제: [`examples/plugins/`](../examples/plugins/)

---

<a id="q-secrets"></a>
## 15. 보안: 키를 어디에 두나요?

- Supabase URL/키, Vercel 토큰 등은 **Git에 커밋하지 마세요.**  
- `config.yaml`에는 `env:SUPABASE_URL`처럼 **이름만** 두고, 실제 값은  
  - 로컬: 환경 변수 / `.env` (보통 gitignore)  
  - CI·Vercel: Secrets / Environment Variables  
- README 예시의 `your-anon-key`, `xxxx.supabase.co`는 **가짜 자리 표시**입니다.

공개 저장소에 실제 키를 한 번이라도 올렸다면, 그 키는 **폐기하고 새로 발급**하는 것이 안전합니다.

---

<a id="q-help"></a>
## 16. 문제가 생기면 어디를 보나요?

1. 이 FAQ와 [시작하기](getting-started.md)  
2. 루트 [README.md](../README.md) 설정·Supabase·Vercel 절  
3. [CHANGELOG](CHANGELOG.md) — 최근에 바뀐 동작  
4. GitHub Issues (공개 저장소) — **비밀번호·키·취약점 상세 PoC는 올리지 마세요**

---

## 아직 궁금하다면

- 큰 그림: [어떻게 동작하나요](how-it-works.md)  
- 배포 층: [배포하기](deploy.md)  
- 단어만: [용어 쉽게 풀기](glossary.md)
