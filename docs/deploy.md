# 배포하기

배포를 **세 층**으로 나누면 선택이 쉬워집니다.

**화면을 보며 따라 하기:** [튜토리얼 — Vercel](tutorials/03-vercel.md) · [Supabase](tutorials/02-supabase.md) · [로컬](tutorials/01-local-testing.md)

## 한눈에

| 층 | 무엇 | 꼭 필요한가 |
| :--- | :--- | :--- |
| **필수** | `dist/` 정적 파일을 어디에든 올려 서빙 | 예 |
| **권장 풀스택** | GitHub Actions + Vercel (+ Supabase) | 아니오 (제일 잘 안내된 경로) |
| **선택** | sync · 조회수 · 대시보드 · 프로덕션 필터 | 아니오 |

상시 가동 VM(가상 서버 컴퓨터) 한 대가 **필수는 아닙니다.**  
→ 오해가 있으면 [FAQ](faq.md#q-server) 를 보세요.

---

## 층 1 — 필수: 정적 파일만

```bash
cd my-blog
npm run build
# 또는 DB 동기화를 끄려면:
npx geulte build --no-sync
```

`dist/`(또는 `config.yaml`의 `build.output`) 안의 파일을 다음 중 어디에든 올리면 됩니다.

- Vercel / Netlify / Cloudflare Pages  
- GitHub Pages  
- S3 + CDN  
- 집·회사 Nginx에서 정적 폴더로 서빙  

**컨테이너(Docker)로 감쌀 필요는 보통 없습니다.**  
이미 “완성된 웹페이지 파일”이라서, 웹 서버가 파일만 내주면 됩니다.

---

## 층 2 — 권장 풀스택 (스캐폴드 기본 스토리)

`geulte init`이 만들어 주는 구성에 가깝습니다.

1. 사이트 코드를 **GitHub** 저장소에 둡니다.  
2. **Vercel**에 프로젝트를 연결하거나, Actions로 배포합니다.  
3. (기능 쓸 때) **Supabase** 프로젝트를 만들고 `schema.sql`을 적용합니다.  
4. 환경 변수 `SUPABASE_URL`, `SUPABASE_KEY` (및 Vercel 배포용 시크릿)를 설정합니다.

스캐폴드의 `.github/workflows/deploy.yml`은 `main` 푸시 시 빌드 후 Vercel에 올리는 흐름을 가정합니다.

자세한 CLI·시크릿 이름은 루트 [README — Vercel 배포](../README.md#vercel-배포)를 보세요.

> GitHub / Vercel / Supabase는 **코드가 강제하는 유일한 조합이 아닙니다.**  
> 다만 공식 문서·템플릿이 이 조합을 가장 깊게 다룹니다.

---

## 층 3 — 선택 기능

| 기능 | 필요할 때 | 비고 |
| :--- | :--- | :--- |
| `database` + sync | 조회수·필터·대시보드용 데이터를 DB에 둘 때 | `config.yaml`의 `database` |
| Vercel `api/filter.js` 등 | 공개 사이트에서 조합 필터 | 로컬은 `geulte dev`가 `/api/filter` 목 제공 |
| Giscus | 댓글 | GitHub Discussions 필요 |

`config.yaml`에서 `database` 절을 빼면 Geulte는 **순수 정적 모드**에 더 가깝게 동작합니다.

---

## 체크리스트

- [ ] `site.url`이 실제 공개 URL과 같은가 (SEO·RSS·OG에 영향)  
- [ ] 시크릿을 README·Git에 넣지 않았는가  
- [ ] 초안은 `draft: true`인가  
- [ ] OG 이미지를 쓰려면 폰트 파일이 있는가 (없으면 생성 생략)  

다음: [설정 안내](config.md) · [FAQ](faq.md)
