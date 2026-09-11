# 튜토리얼 01 — 로컬에서 테스트하기

이 문서만 따라 하면, **내 컴퓨터에서** Geulte 블로그를 브라우저로 볼 수 있습니다.  
Supabase·Vercel·GitHub은 **아직 필요 없습니다.**

목표: `http://localhost:3000` 에서 예시 글이 보인다.

---

## 0. 터미널이 뭔가요?

컴퓨터를 마우스 대신 **글자 명령**으로 다루는 창입니다.

- **macOS:** Spotlight(`⌘ + Space`) → `터미널` 또는 `Terminal` 검색 → 실행  
- **Windows:** 시작 메뉴 → `PowerShell` 또는 `Windows Terminal`  
- **Linux:** 보통 `Ctrl + Alt + T`

앞으로 “터미널에 입력하세요”라고 하면, 이 창에 명령을 치고 **Enter** 를 누르면 됩니다.

> 복사할 때 `$` 기호는 프롬프트(컴퓨터가 보여주는 장식)인 경우가 많습니다.  
> **`$` 는 치지 말고**, 그 뒤에 있는 명령만 복사하세요.

---

## 1. Node.js가 설치되어 있는지 확인

터미널에 입력:

```bash
node -v
```

### 잘 된 경우

```text
v20.11.0
```

처럼 `v20` 이상이 나오면 됩니다. (`v22`, `v24`도 OK)

### 안 되는 경우

`command not found` / 인식할 수 없는 명령 이면:

1. [https://nodejs.org](https://nodejs.org) 접속  
2. **LTS** 버튼으로 설치 파일 받기  
3. 설치 마법사 그대로 진행  
4. **터미널을 완전히 닫았다가 다시 연 다음** `node -v` 재시도  

같이 확인:

```bash
npm -v
```

숫자가 나오면 OK. (`npm`은 Node와 함께 오는 패키지 설치 도구입니다.)

---

## 2. 작업할 위치 정하기

어디에 블로그 폴더를 만들지는 자유입니다. 예: 홈 폴더의 `Code` 안.

```bash
# macOS / Linux 예시 — 홈으로 이동 후 Code 폴더 만들기
cd ~
mkdir -p Code
cd Code
```

Windows PowerShell 예시:

```powershell
cd $HOME
mkdir Code -Force
cd Code
```

`pwd`(mac/Linux) 또는 `pwd` / `cd`(PowerShell에서 현재 위치 확인)로 지금 어디인지 볼 수 있습니다.

---

## 3. 새 Geulte 사이트 만들기

### 방법 A — npm에 `geulte`가 공개된 경우 (표준)

```bash
npx geulte init my-blog
```

- `npx` = “패키지를 받아서 한 번 실행해 줘”  
- `init` = “새 프로젝트 뼈대를 만들어 줘”  
- `my-blog` = 만들어질 **폴더 이름** (원하는 이름으로 바꿔도 됨)

처음이면 `Need to install the following packages` 비슷한 질문이 나올 수 있습니다.  
`y` 또는 Enter로 진행하면 됩니다.

### 방법 B — npm에서 아직 패키지를 못 찾을 때

공개 전이거나 설치가 실패하면, Geulte **소스 저장소**를 쓰는 방법이 있습니다.

1. [https://github.com/s4ngwoo/geulte](https://github.com/s4ngwoo/geulte) 에서 코드를 받습니다.  
2. 프레임워크를 빌드한 뒤, 같은 저장소의 `templates`로 사이트를 만들거나,  
   유지자가 안내하는 `npm pack` → `file:….tgz` 설치를 따릅니다.

이 튜토리얼 본문은 **방법 A로 `my-blog` 폴더가 생긴 상태**를 기준으로 계속합니다.  
방법 B로 만든 사이트도 폴더 구조가 같으면 아래 단계가 동일합니다.

성공하면 `Code` 안에 `my-blog` 폴더가 생깁니다.

```bash
cd my-blog
ls
```

대략 이런 것들이 보이면 성공입니다.

```text
api/
config.yaml
content/
package.json
schema.sql
vercel.json
...
```

---

## 4. 의존성 설치 (`npm install`)

아직 `my-blog` 안에 있는지 확인한 뒤:

```bash
npm install
```

### 이 명령이 하는 일

`package.json`에 적힌 라이브러리(Geulte 포함)를 인터넷에서 받아  
`node_modules/` 폴더에 저장합니다. **처음엔 몇 분** 걸릴 수 있습니다.

### 잘 된 경우

에러 없이 끝나고, 다시 `ls` 하면 `node_modules` 와 `package-lock.json`이 보입니다.

### 자주 나는 문제

| 메시지 | 대처 |
| :--- | :--- |
| `ENOENT` / `package.json` 없음 | `cd my-blog`를 안 한 상태. 폴더 안으로 들어가세요. |
| 네트워크 오류 | 와이파이·VPN·회사 방화벽 확인 후 다시 `npm install` |
| `geulte` 패키지를 찾을 수 없음 | 위의 **방법 B** 또는 저장소 README의 설치 안내 |

---

## 5. 개발 서버 켜기 (미리보기)

```bash
npm run dev
```

내부적으로 `geulte dev`가 실행됩니다.

### 잘 된 경우

터미널에 대략 이런 내용이 보입니다. (문구는 버전마다 조금 다를 수 있음)

```text
http://localhost:3000
```

또는 “서버가 열렸다”는 식의 로그.

이제 **브라우저**(Chrome, Safari, Edge 등)를 열고 주소창에 입력:

```text
http://localhost:3000
```

예시 글·레이아웃이 보이면 **로컬 테스트 성공**입니다.

### 이 서버는 무엇인가요?

- **내 컴퓨터에서만** 보이는 미리보기입니다.  
- 친구의 휴대폰에서 같은 주소로 접속해도 **보통 안 됩니다.**  
- 터미널에서 `Ctrl + C`(Mac도 동일)를 누르면 서버가 **꺼집니다.**  
- 인터넷 전체에 공개하는 배포가 **아닙니다.** (공개는 [03 Vercel](03-vercel.md))

### 글 수정이 바로 반영되나요?

`content/posts/` 안의 마크다운을 저장하면, 개발 서버가 다시 빌드하고  
브라우저가 새로고침되는 **라이브 리로드**가 동작하는 것이 정상입니다.  
안 바뀌면 브라우저를 수동 새로고침(`⌘R` / `F5`) 해 보세요.

---

## 6. 직접 확인해 볼 화면 (체크리스트)

브라우저에서 하나씩 눌러 보세요.

| 확인 | 어떻게 |
| :--- | :--- |
| 홈 | `http://localhost:3000/` |
| 글 목록 | `http://localhost:3000/posts` |
| 예시 글 | 목록에서 글 제목 클릭 |
| 소개 페이지 | `http://localhost:3000/about` (스캐폴드에 `about.md`가 있는 경우) |
| 검색 | `⌘K`(Mac) 또는 `Ctrl+K`(Windows) — 검색 창 |
| 다크/라이트 | 헤더의 테마 토글 |

필터 패널(`/posts`)은 켜질 수 있습니다.  
로컬에서는 개발 서버가 `/api/filter`를 흉내 내 주는 경우가 많고,  
**Supabase 없이도** 목록·검색·테마는 충분히 시험할 수 있습니다.

---

## 7. 글을 하나 추가해 보기

1. 에디터(Obsidian, VS Code, 메모장)로 이 파일을 만듭니다.

   `content/posts/hello-local.md`

2. 내용을 넣습니다.

```markdown
---
title: "로컬에서 쓴 첫 글"
date: 2026-09-11
tags: ["연습"]
draft: false
---

안녕하세요. 로컬 테스트 글입니다.
```

3. 저장합니다.  
4. 브라우저에서 홈 또는 `/posts`를 새로고침합니다.  
5. 새 글이 보이면 OK.

초안으로만 두고 사이트에 안 나가게 하려면 `draft: true` 로 두세요.  
→ 자세한 작성법: [글 작성하기](../writing.md)

---

## 8. 배포용 빌드만 로컬에서 시험 (선택)

미리보기 서버를 끈 뒤(`Ctrl + C`):

```bash
npm run build
```

### 하는 일

마크다운을 HTML 등으로 바꿔 `dist/`(기본) 폴더를 만듭니다.  
나중에 Vercel 등에 올리는 **바로 그 결과물**입니다.

```bash
ls dist
```

`index.html` 등이 보이면 빌드 성공입니다.

> `config.yaml`에 Supabase `database`가 있고 환경 변수가 없으면,  
> 빌드 중 sync 단계에서 경고·오류가 날 수 있습니다.  
> 그럴 때는:
>
> ```bash
> npx geulte build --no-sync
> ```
>
> 또는 다음 튜토리얼에서 환경 변수를 설정하세요.

---

## 9. 다음에 이어서 할 때

같은 폴더로 다시 들어가서:

```bash
cd ~/Code/my-blog   # 본인 경로에 맞게
npm run dev
```

`npm install`은 **처음 한 번** (또는 `package.json`이 바뀌었을 때)만 하면 됩니다.

---

## 문제 해결

### 포트 3000이 이미 사용 중

다른 프로그램이 3000을 쓰고 있습니다.

```bash
npx geulte dev -p 3001
```

브라우저에서는 `http://localhost:3001` 로 접속합니다.

### `config.yaml을 찾을 수 없습니다`

`my-blog` **밖**에서 `npm run dev`를 실행한 것입니다.  
`cd my-blog` 후 다시 시도하세요.

### 페이지가 하얗거나 스타일이 깨짐

1. 터미널에 빨간 에러가 있는지 확인  
2. 브라우저 개발자 도구(F12) → Console 에 빨간 글씨 확인  
3. `npm install`을 한 번 더 실행  
4. `Ctrl+C`로 끄고 `npm run dev` 재실행  

### `EADDRINUSE`

포트 충돌과 같습니다. `-p`로 다른 번호를 쓰세요.

---

## 성공 기준 (이 문서 완료)

- [ ] `node -v`가 20 이상  
- [ ] `my-blog`에서 `npm install` 성공  
- [ ] `npm run dev` 후 `http://localhost:3000` 에 사이트 표시  
- [ ] (선택) 새 마크다운 글이 목록에 보임  
- [ ] (선택) `npm run build`로 `dist/` 생성  

**다음:** [02 — Supabase 연동하기](02-supabase.md)  
**또는:** 로컬만 쓸 거면 [FAQ](../faq.md) · [배포 개요](../deploy.md)
