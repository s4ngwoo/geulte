# 튜토리얼 02 — Supabase 연동하기

이 문서는 **Supabase 계정이 처음**인 분을 기준으로, 클릭 순서까지 적어 두었습니다.  
[01 로컬 테스트](01-local-testing.md)로 `my-blog` 폴더가 있고 `npm run dev`가 되는 상태를 권장합니다.

## Supabase가 뭔가요? (30초)

**클라우드에 있는 데이터베이스(장부)** 를 빌려 쓰는 서비스입니다.

Geulte에서는 예를 들어:

- 빌드/sync 때 글 제목·태그 등을 DB에 넣어 두고  
- 조회수를 올리고  
- (배포 후) 조합 필터 API가 DB를 조회하고  
- `/dashboard` 통계  

같은 **선택 기능**에 씁니다.

> 글 본문을 읽히는 데 Supabase는 **필수가 아닙니다.**  
> 정적 사이트만으로도 블로그는 됩니다. → [FAQ](../faq.md#q-stack)

---

## 전체 지도

```text
① supabase.com 가입·프로젝트 만들기
② SQL Editor에서 schema.sql 실행 (테이블 만들기)
③ Project Settings에서 URL·anon key 복사
④ 내 컴퓨터에 환경 변수로 넣기
⑤ config.yaml의 database 확인
⑥ geulte sync 또는 npm run build
⑦ (선택) 대시보드·조회수 확인
```

---

## 1. 계정 만들고 프로젝트 생성

1. 브라우저에서 [https://supabase.com](https://supabase.com) 접속  
2. **Start your project** / **Sign up** 등으로 가입  
   - GitHub 로그인해도 됩니다.  
3. 로그인 후 **New project**  
4. 대략 이렇게 채웁니다. (이름은 예시)

   | 항목 | 예시 | 설명 |
   | :--- | :--- | :--- |
   | Organization | 기본값 | 없으면 새로 만들기 |
   | Project name | `my-geulte-blog` | 기억하기 쉬운 이름 |
   | Database password | **강한 비밀번호** | **꼭 비밀번호 관리자에 저장** |
   | Region | 가까운 지역 | 나중에 바꾸기 어려울 수 있음 |

5. **Create new project** 클릭 후, 프로젝트가 준비될 때까지 1~2분 기다립니다.

> Database password는 Geulte `SUPABASE_KEY`와 **다른 것**입니다.  
> Geulte가 쓰는 키는 다음 단계에서 복사하는 **anon public** 키입니다.

---

## 2. 테이블 만들기 (SQL 실행)

Geulte가 기대하는 표(테이블)와 함수를 DB에 만들어야 합니다.  
사이트 폴더에 이미 `schema.sql` 파일이 있습니다.

### 2-1. SQL 내용 복사

로컬에서:

```bash
cd ~/Code/my-blog    # 본인 경로
```

에디터로 `schema.sql` 전체를 열어 **모두 복사**합니다.  
(프레임워크를 쓰는 경우 저장소의 `templates/scaffold/schema.sql`과 같은 내용입니다.)

### 2-2. Supabase SQL Editor

1. Supabase 대시보드 왼쪽 메뉴 **SQL Editor**  
2. **New query**  
3. 복사한 SQL을 붙여넣기  
4. **Run** (또는 ⌘/Ctrl + Enter)

### 잘 된 경우

아래쪽에 success / Success. No rows returned 비슷한 메시지가 나옵니다.  
왼쪽 **Table Editor**에 `posts`, `backlinks` 테이블이 보이면 성공입니다.

### 실패할 때

- 일부를 빼먹고 붙여넣기 → **전체**를 다시 복사  
- 이미 테이블이 있어 충돌 → `IF NOT EXISTS`가 있으면 대부분 안전. 메시지를 읽고, 필요하면 Table Editor에서 기존 테스트 테이블을 정리  

---

## 3. URL과 API 키 복사

1. 왼쪽 아래쪽 **Project Settings**(톱니바퀴)  
2. **API** 메뉴  
3. 다음 두 값을 메모장에 임시 저장합니다. (**GitHub·채팅에 올리지 마세요.**)

| 대시보드 이름 | 환경 변수 이름 | 용도 |
| :--- | :--- | :--- |
| **Project URL** | `SUPABASE_URL` | `https://abcdefgh.supabase.co` 형태 |
| **anon public** 키 | `SUPABASE_KEY` | 긴 `eyJ...` 문자열 |

> **service_role** 키는 권한이 매우 셉니다.  
> 브라우저·공개 저장소·이 튜토리얼의 기본 설정에는 **넣지 마세요.**  
> README·스캐폴드는 **anon** 키를 기준으로 합니다.

---

## 4. 로컬 환경 변수 넣기

Geulte는 `config.yaml`에 이렇게 적혀 있으면:

```yaml
database:
  provider: "supabase"
  url: "env:SUPABASE_URL"
  key: "env:SUPABASE_KEY"
```

실제 값은 **환경 변수** `SUPABASE_URL`, `SUPABASE_KEY`에서 읽습니다.  
(`env:` 뒤의 이름이 변수 이름입니다.)

### 4-1. config.yaml 확인

`my-blog/config.yaml`을 열어 `database:` 절이 있는지 봅니다.  
`geulte init` 스캐폴드에는 보통 **이미 있습니다.**  
없다면 위 블록을 파일 하단에 추가하세요.

### 4-2. 터미널에 임시로 넣기 (가장 단순)

**매번 새 터미널을 열면 다시 입력해야** 합니다.

macOS / Linux (zsh, bash):

```bash
export SUPABASE_URL="https://여기에-프로젝트-URL"
export SUPABASE_KEY="여기에-anon-키"
```

Windows PowerShell:

```powershell
$env:SUPABASE_URL="https://여기에-프로젝트-URL"
$env:SUPABASE_KEY="여기에-anon-키"
```

확인:

```bash
# mac/Linux
echo $SUPABASE_URL

# PowerShell
echo $env:SUPABASE_URL
```

URL이 그대로 출력되면 OK.

### 4-3. `.env` 파일로 관리 (추천 습관)

`my-blog` 폴더에 `.env` 파일을 만듭니다. (**절대 git commit 하지 마세요.**  
보통 `.gitignore`에 `.env`가 들어 있습니다.)

```bash
# .env 파일 내용 예시 — 따옴표 없이 써도 됨
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.예시
```

Geulte CLI는 버전마다 `.env`를 **자동으로 안 읽을 수** 있습니다.  
그래서 명령을 치기 **전에** 셸에 불러옵니다.

macOS / Linux:

```bash
cd ~/Code/my-blog
set -a
source .env
set +a
```

그 다음 같은 터미널에서 `npm run sync` 등을 실행합니다.

Windows PowerShell에서는 한 줄씩 `$env:NAME="value"`를 쓰거나,  
dotenv를 로드해 주는 도구를 쓰는 편이 쉽습니다. 처음이면 **4-2 export 방식**을 추천합니다.

---

## 5. 동기화 실행 (`sync`)

환경 변수를 넣은 **그 터미널**에서:

```bash
cd ~/Code/my-blog
npm run sync
```

또는:

```bash
npx geulte sync
```

### 잘 된 경우

터미널에 동기화 시작·완료 로그가 보입니다.  
Supabase **Table Editor → posts**에 예시 글의 `slug`, `title` 등이 행으로 보이면 성공입니다.

### 빌드와 함께 sync

```bash
npm run build
```

은 기본적으로 (database 설정이 있으면) sync도 시도합니다.  
HTML만 만들고 DB는 건드리지 않으려면:

```bash
npx geulte build --no-sync
```

---

## 6. 권한(RLS) 때문에 막힐 때

Supabase는 보안을 위해 **Row Level Security(RLS)** 를 쓸 수 있습니다.  
테이블을 직접 만든 직후에는 RLS가 꺼져 있어 anon 키로 sync가 되는 경우가 많습니다.  
만약 에러에 `permission denied` / `RLS` / `42501` 이 보이면:

1. Table Editor에서 `posts` 선택  
2. **RLS** 관련 설정 확인  
3. **개인 연습용**으로만, 정책을 열어 읽기·쓰기를 허용하거나  
   (익숙하다면) “anon은 읽기만, sync는 로컬에서만” 같은 정책을 설계  

공개 블로그에 **누구나 DB에 글을 쓰게** 열어 두는 것은 위험합니다.  
연습이 끝나면 정책을 조이세요.  
이 튜토리얼은 “연동을 처음 성공”하는 데 초점을 둡니다.

---

## 7. 로컬에서 무엇이 달라지나요?

| 기능 | Supabase 연동 후 |
| :--- | :--- |
| 글 HTML 읽기 | 여전히 정적 파일 (필수 아님) |
| `geulte sync` | posts/backlinks 테이블 갱신 |
| 조회수 RPC | `increment_view_count`가 schema에 있으면 준비됨 (프론트·API와 연결) |
| `/dashboard` | database 설정이 있을 때 빌드에 포함되는 구성 |
| 조합 필터 | **공개 배포**에서는 Vercel `api/filter` + 이 DB를 씀. 로컬은 `geulte dev` 목 API도 가능 |

로컬 `npm run dev`만으로 “필터가 DB를 치는지”까지 완벽히 같지 않을 수 있습니다.  
최종 확인은 [03 Vercel](03-vercel.md) 배포 후가 확실합니다.

---

## 8. 키가 유출되면?

1. Supabase → Project Settings → API → 키 **Rotate**(재발급)  
2. 로컬·Vercel·GitHub Secrets에 새 키로 교체  
3. 예전에 커밋·채팅에 올린 키가 있으면 **반드시** 폐기  

---

## 문제 해결

| 증상 | 확인 |
| :--- | :--- |
| `database 설정이 없습니다` | `config.yaml`에 `database:` 절이 있는지 |
| URL/키가 비어 있음 | `echo $SUPABASE_URL` (또는 PowerShell `$env:…`) — 빈 출력이면 export 안 된 것 |
| `Invalid API key` | anon 키인지, 앞뒤 공백·따옴표 깨짐 없는지 |
| 테이블 없음 | SQL Editor에서 `schema.sql` 전체 재실행 |
| sync는 성공인데 사이트가 안 바뀜 | sync는 HTML을 안 만듦 → `npm run build` / 배포 필요 |

---

## 성공 기준 (이 문서 완료)

- [ ] Supabase 프로젝트 생성  
- [ ] `schema.sql` 실행 → `posts` / `backlinks` 존재  
- [ ] `SUPABASE_URL` / `SUPABASE_KEY`(anon) 환경 변수 설정  
- [ ] `npm run sync` 성공 및 Table Editor에 행 확인  

**이전:** [01 로컬 테스트](01-local-testing.md)  
**다음:** [03 Vercel 연동·배포](03-vercel.md)
