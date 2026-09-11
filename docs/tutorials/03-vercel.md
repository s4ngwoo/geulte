# 튜토리얼 03 — Vercel 연동·배포하기

이 문서는 **Vercel에 처음** 올리는 분을 기준으로 합니다.  
권장 준비:

- [01](01-local-testing.md)로 로컬 사이트가 된다  
- (필터·조회수·sync까지 쓰려면) [02](02-supabase.md)까지 끝냈다  

Supabase 없이 **정적 페이지만** 공개하는 것도 가능합니다. 그 경우 환경 변수 단계는 건너뛰면 됩니다.

## Vercel이 뭔가요? (30초)

만든 웹사이트 파일을 인터넷에 올려 주고,  
주소(`https://….vercel.app`)로 접속하게 해 주는 **호스팅** 서비스입니다.  
Geulte 스캐폴드는 Vercel의 **정적 파일 + `api/` 서버리스 함수** 조합을 가정합니다.

> 상시 Linux 서버를 빌리는 것과 다릅니다.  
> → [FAQ — 서버가 꼭 필요해요?](../faq.md#q-server)

---

## 배포 방법 두 가지

| 방법 | 난이도 | 이런 분께 |
| :--- | :--- | :--- |
| **A. Vercel 웹사이트 + GitHub 연결** | 초보에게 제일 쉬움 | 마우스 위주 |
| **B. Vercel CLI** | 터미널에 익숙하면 | 로컬에서 바로 올리기 |
| **C. GitHub Actions** (스캐폴드 포함) | 설정이 더 많음 | 푸시할 때마다 자동 배포 |

아래는 **A를 중심으로** 자세히 적고, B·C는 이어서 안내합니다.

---

## 방법 A — GitHub에 올리고 Vercel이 자동 배포 (추천)

### A-1. GitHub에 저장소 만들기

1. [https://github.com](https://github.com) 로그인  
2. **New repository**  
3. 이름 예: `my-geulte-blog`  
4. Public/Private 선택  
5. **README를 자동으로 추가하지 않은 빈 저장소**가 따라 하기 쉽습니다.  
6. Create repository

### A-2. 로컬 폴더를 GitHub에 푸시

터미널 (경로는 본인에 맞게):

```bash
cd ~/Code/my-blog

# 아직 git이 없으면
git init
git add .
git status
```

`git status`에서 **절대 보이면 안 되는 것:**

- `.env`  
- 실제 Supabase 키·비밀번호가 적힌 파일  

보이면 `git restore --staged .env` 등으로 빼고, `.gitignore`에 `.env`가 있는지 확인하세요.

```bash
git commit -m "Initial geulte blog"
```

GitHub에서 만든 저장소 URL을 연결합니다. (HTTPS 예시)

```bash
git branch -M main
git remote add origin https://github.com/당신의아이디/my-geulte-blog.git
git push -u origin main
```

GitHub 로그인·토큰 요구가 나오면 안내에 따릅니다.  
(비밀번호 대신 **Personal Access Token**을 쓰는 경우가 많습니다.)

### A-3. Vercel 계정·프로젝트 연결

1. [https://vercel.com](https://vercel.com) 가입/로그인 (GitHub로 가입 추천)  
2. **Add New… → Project**  
3. 방금 올린 GitHub 저장소 **Import**  
4. 프레임워크 프리셋은 비어 있거나 Other여도 됩니다.  
5. **Root Directory**는 저장소 루트 (스캐폴드 기준)  
6. Build 설정 예:

   | 항목 | 값 |
   | :--- | :--- |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

7. **Environment Variables**에 (Supabase 쓸 때):

   | Name | Value |
   | :--- | :--- |
   | `SUPABASE_URL` | 프로젝트 URL |
   | `SUPABASE_KEY` | anon 키 |

   Environment는 Production / Preview 모두 체크해 두면 편합니다.

8. **Deploy** 클릭 후 완료를 기다립니다.

### A-4. 결과 확인

- Vercel이 준 `https://프로젝트명.vercel.app` 주소를 엽니다.  
- 홈·글·`/posts`가 보이면 기본 배포 성공입니다.  
- Supabase를 넣었다면 Table Editor와 sync가 CI/빌드에서 돌았는지 로그를 확인합니다.

### A-5. 글을 수정한 뒤

로컬에서 마크다운 수정 → commit → push → Vercel이 다시 빌드·배포합니다.

```bash
git add content/posts/내글.md
git commit -m "Add post"
git push
```

---

## `api/` 폴더와 조합 필터

스캐폴드에는 예를 들어 다음이 있습니다.

```text
api/filter.js
api/track-view.js
api/backlinks.js
```

Vercel은 보통 프로젝트 루트의 `api/*.js`를 **서버리스 함수**로 배포합니다.  
공개 사이트에서 `/posts` 조합 필터가 동작하려면:

1. 이 `api` 파일이 저장소에 있고  
2. Vercel에 `SUPABASE_URL` / `SUPABASE_KEY`가 있으며  
3. Supabase에 `schema.sql`이 적용되어 있고  
4. 빌드 시(또는 sync로) `posts`에 데이터가 있어야 합니다.

배포 후 브라우저에서:

```text
https://당신의주소.vercel.app/api/filter
```

비슷한 주소를 열어 JSON이 오는지 확인할 수 있습니다.  
(파라미터 없이면 빈 결과·에러 형식이어도, “함수가 살아 있는지” 단서가 됩니다.)

`vercel.json`은 정적 경로 라우팅·캐시 헤더를 돕습니다.  
배포 후에도 404가 나면 Vercel 대시보드 **Deployments → 해당 배포 → Building / Functions** 로그를 엽니다.

---

## 방법 B — Vercel CLI로 올리기

GitHub 없이 로컬에서 바로 올릴 때.

### B-1. CLI 설치·로그인

```bash
npm i -g vercel
vercel login
```

브라우저가 열리면 로그인합니다.

### B-2. 프로젝트 폴더에서 연결

```bash
cd ~/Code/my-blog
vercel
```

질문에 대략:

- Set up and deploy? **Y**  
- Scope / 계정 선택  
- Link to existing project? 처음이면 **N**  
- Project name · 디렉터리 `.`  

### B-3. 환경 변수

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
```

값을 붙여넣고, Production / Preview / Development 중 어디에 넣을지 선택합니다.

로컬에서 Vercel 환경처럼 쓰려면:

```bash
vercel env pull .env.local
```

(`.env.local`도 커밋하지 마세요.)

### B-4. 프로덕션 배포

```bash
npm run build
vercel --prod
```

또는 빌드 설정을 Vercel에 맡기는 방식이면 대시보드와 동일하게 Git 연결을 쓰는 편이 단순합니다.

---

## 방법 C — 스캐폴드 GitHub Actions

`geulte init`이 넣어 주는 `.github/workflows/deploy.yml`은 대략:

1. `main` 푸시 시  
2. `npm ci` · `npm run build` (Secrets의 Supabase 사용)  
3. Vercel Action으로 프로덕션 배포  

### 필요한 GitHub Secrets

저장소 → **Settings → Secrets and variables → Actions → New repository secret**

| Secret 이름 | 어디서 얻나 |
| :--- | :--- |
| `SUPABASE_URL` | Supabase API 설정 |
| `SUPABASE_KEY` | anon 키 |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel` 링크 후 `.vercel/project.json` 등 또는 대시보드 |
| `VERCEL_PROJECT_ID` | 위와 동일 |

조직/프로젝트 ID는 CLI로 한 번 `vercel` 연동 후 생기는 `.vercel/project.json`을 참고하는 경우가 많습니다.  
(`.vercel/`는 로컬 상태라 보통 gitignore합니다. ID만 Secrets에 복사.)

Secrets가 비어 있으면 Actions 탭에서 빨간 X가 납니다. 로그를 열어 어느 변수인지 확인하세요.

> 방법 A(Vercel이 GitHub을 직접 빌드)와 방법 C(Actions가 빌드 후 Vercel에 업로드)를  
> **동시에 둘 다** 켜 두면 배포가 두 번 돌 수 있습니다.  
> 초보는 **방법 A만** 쓰는 것을 추천합니다.

---

## `site.url` 맞추기

`config.yaml`:

```yaml
site:
  url: "https://당신의주소.vercel.app"
```

실제 공개 URL과 맞추세요. RSS·사이트맵·OG 링크에 쓰입니다.  
커스텀 도메인을 연결했다면 그 주소로 바꿉니다.

변경 후 commit · push · 재배포.

---

## 배포 후 체크리스트

- [ ] 홈이 열린다  
- [ ] 글 본문이 열린다  
- [ ] `/posts` 목록  
- [ ] (선택) `/about`  
- [ ] (선택) 검색 ⌘K  
- [ ] (선택) Supabase Table에 글이 있다  
- [ ] (선택) `/api/filter` 응답  
- [ ] (선택) `/dashboard` — database 설정·빌드 포함 시  

---

## 문제 해결

### Build failed — geulte not found

`package.json`의 `geulte` 의존성이 npm에 없거나 버전이 잘못된 경우입니다.  
로컬에서 `npm install`이 되는 상태와 동일하게 lockfile을 커밋했는지 확인하세요.

### Build failed — Supabase / env

환경 변수가 Vercel에 없거나 이름 오타 (`SUPABASE_KEY` vs `SUPABASE_ANON_KEY`).  
대시보드 Environment Variables를 다시 확인한 뒤 **Redeploy**.

### 사이트는 뜨는데 필터만 실패

1. Functions 로그  
2. Supabase에 데이터·schema  
3. 브라우저 네트워크 탭에서 `/api/filter` 상태 코드  

### 404 on refresh of /posts/some-slug

`vercel.json` 라우팅·`dist` 출력 구조 문제일 수 있습니다.  
스캐폴드 `vercel.json`이 저장소 루트에 있는지, Output Directory가 `dist`인지 확인합니다.

### 로컬에선 되는데 배포만 깨짐

대소문자 파일명(Linux CI는 대소문자 구분), `site.url`, 환경 변수 미설정이 흔한 원인입니다.

---

## 성공 기준 (이 문서 완료)

- [ ] `https://….vercel.app` (또는 커스텀 도메인)에서 사이트 표시  
- [ ] (선택) Supabase 환경 변수 연결  
- [ ] (선택) 글 push 후 자동 재배포 확인  
- [ ] `config.yaml`의 `site.url` 업데이트  

**이전:** [02 Supabase](02-supabase.md)  
**목차:** [튜토리얼 홈](README.md)  
**개념:** [배포하기](../deploy.md) · [FAQ](../faq.md)
