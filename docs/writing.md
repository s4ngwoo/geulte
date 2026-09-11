# 글 작성하기

Geulte에는 **웹 관리자 화면에서 글을 쓰는 WYSIWYG 에디터**가 없습니다.  
글을 쓰는 곳은 **내 컴퓨터의 마크다운 파일**이고, 사이트에 “올리는” 행위는 보통 **Git에 푸시하거나 `dist`를 배포하는 것**입니다.

## 추천 흐름 (Obsidian)

1. Obsidian에서 볼트(노트 폴더)를 엽니다.  
2. 사이트 프로젝트의 `content/posts/` 를 볼트로 쓰거나, 볼트와 이 폴더를 맞춰 둡니다.  
3. 새 노트에 프론트매터(맨 위 YAML)를 넣고 본문을 씁니다.  
4. 저장합니다.  
5. (배포) Git commit → push 하거나, `geulte build` 후 `dist`를 올립니다.

“업로드 버튼”이 있는 CMS가 아니라, **파일 + 빌드 + 배포** 모델입니다.  
자세한 오해 풀이 → [FAQ — 업로드는 어떻게 해요?](faq.md#q-upload)

## 파일 위치

```text
my-blog/
├── content/
│   ├── posts/          ← 블로그 글 (목록·RSS에 포함)
│   │   ├── assets/     ← 이미지 등
│   │   └── 내-글.md
│   └── pages/          ← 고정 페이지 (소개 등). 목록·RSS에 안 넣음
│       └── about.md
├── config.yaml
└── ...
```

`geulte init` 스캐폴드에는 `content/pages/about.md` 예시가 들어 있습니다.

## 프론트매터 예시

파일 맨 위에 `---`로 감싼 설정 블록입니다.

```markdown
---
title: "첫 글 제목"
date: 2026-09-11
tags: ["시작", "Geulte"]
topics: ["블로그"]
category: "일기"
description: "검색엔진·SNS용 짧은 설명"
draft: false
---

본문을 여기에 씁니다.

[[다른 글 제목]] 처럼 위키링크도 됩니다.
```

| 필드 | 의미 |
| :--- | :--- |
| `title` | 제목. 없으면 파일명에서 만듦 |
| `date` | 날짜. 없으면 파일 수정 시각 |
| `tags` / `topics` / `keywords` | 여러 개 가능한 분류 |
| `category` | 카테고리 하나 |
| `series` | 시리즈 이름 (묶음 글) |
| `description` | SEO·소셜 미리보기 요약 |
| `cover` / `image` | 대표 이미지 경로 |
| `draft: true` | 빌드에서 **제외** (아직 안 올린 초안) |

전체 기능 목록은 루트 [README.md](../README.md)의 마크다운·설정 절을 보세요.

## Obsidian에서 쓰기 좋은 문법

Geulte는 Obsidian 풍 문법을 많이 이해합니다.

- `[[위키링크]]`, `[[제목|표시]]`
- Callout: `> [!NOTE]` …
- 각주, 수식(KaTeX), Mermaid 다이어그램
- 코드 블록 (빌드 시 Shiki로 색칠)

미리보기는 Obsidian 미리보기와 **픽셀 단위로 같지 않을 수** 있습니다.  
최종 모양은 반드시 `npm run dev`로 사이트에서 확인하세요.

## “올렸다”의 의미

| 행동 | 실제로 일어나는 일 |
| :--- | :--- |
| 파일 저장 | 내 디스크에만 반영 |
| `geulte build` | `dist/` HTML 생성 (+ 설정 시 Supabase sync) |
| Git push (CI 있을 때) | 원격에서 빌드 → 호스팅에 배포 |
| `geulte sync`만 | **사이트 HTML을 안 만들고** DB 메타만 맞춤 |

방문자가 새 글을 보려면, 결국 **새 HTML이 호스팅에 반영**되어야 합니다.
