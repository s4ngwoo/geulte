# 설정 안내

자세한 예시 YAML은 루트 [README.md](../README.md)의 `config.yaml` 레퍼런스를 기준으로 하세요.  
여기에서는 **무엇을 켜면 무엇이 바뀌는지**만 짧게 정리합니다.

## CLI

```bash
geulte init <이름>     # 새 사이트 뼈대
geulte dev [-p 3000]   # 로컬 미리보기 + 파일 감시 + 라이브 리로드
geulte build           # 정적 사이트 생성 (+ database 있으면 sync)
geulte build --no-sync # sync 없이 빌드만
geulte sync            # 빌드 없이 Supabase만 맞춤
```

## `config.yaml` 핵심

| 절 | 역할 |
| :--- | :--- |
| `site` | 제목, **절대 URL**(`url`), 설명, 작성자, 소셜 링크 |
| `taxonomy` | 태그·토픽·키워드·카테고리 라벨/경로 |
| `theme` | 다크모드, 사이드바, TOC, 위젯 옵션 |
| `database` | **선택.** 있으면 Supabase sync·대시보드 등 |
| `build.output` | 결과 폴더 (기본 `dist`) |
| `build.incremental` | **예약만.** 아직 구현되지 않음 (무시됨) |
| `build.images` | **선택.** sharp로 WebP/AVIF srcset |
| `comments` | Giscus 등 |
| `i18n` | 다국어 로케일 |

`database.url` / `key`에 `env:SUPABASE_URL`처럼 쓰면, 실제 값은 환경 변수에서 읽습니다.  
**키를 파일에 직접 적지 마세요.**

## 플러그인 (`geulte.config.mjs`)

현재 지원 훅은 세 가지뿐입니다.

- `onConfig`
- `afterScan`
- `afterGenerate`

`beforeParse` / `afterParse` / `beforeRender` 등은 **아직 없습니다.**  
예제: [`examples/plugins/`](../examples/plugins/).

## 테마·템플릿

사용자 사이트에서는 스캐폴드의 테마를 쓰거나 덮어씁니다.  
프레임워크 레포의 `templates/`는 **init이 복사해 주는 원본**과 테마 엔진용 파일입니다.  
프레임워크 `src/`와 사용자 `content/`를 섞지 마세요.
