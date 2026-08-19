# 페이지 템플릿

새 study 페이지를 만들 때 아래 3개 템플릿 중 하나를 골라 시작하세요. 전부 사이트 공통 헤더·다크모드 토글·목차 위젯이 이미 연결되어 있고, 각자의 CSS 변수만 바꾸면 새로운 색상 정체성을 가진 페이지를 만들 수 있습니다.

## 템플릿 목록

| 템플릿 | 느낌 | 기본 팔레트 | 참고 예시 |
|---|---|---|---|
| `template-mono-dark.html` | 기술적, 모노스페이스, 차가운 톤 | 다크 기본 (`--bg:#0b0f16`) | jwt-study, webhook-study |
| `template-editorial-light.html` | 에디토리얼, 세리프 느낌, 종이 톤 | 라이트 기본 (`--paper:#f2f4f8`) | solid-principles-study, spring-framework-study-v2 |
| `template-docs-neutral.html` | 깔끔한 문서/레퍼런스 스타일 | 라이트 기본 (`--bg:#fafbfc`) | mcp-study-guide |

3개면 충분한 이유: 지금까지 나온 12개 스터디 페이지가 실제로 이 세 가지 색상 언어 중 하나로 수렴했습니다. 새 주제가 이 셋 중 어디에도 안 맞으면 새 템플릿을 하나 더 추가하되(`template-<name>.html`), 이 README에도 줄을 추가하세요.

## 새 페이지 만드는 법

1. 템플릿 하나를 골라 `study/<파일명>.html`로 복사합니다.
   ```bash
   cp templates/template-mono-dark.html study/my-new-study.html
   ```
2. 템플릿 안의 `{{PLACEHOLDER}}` 자리를 실제 내용으로 채웁니다 (`{{PAGE_TITLE}}`, `{{SECTION_1_BODY}}` 등).
3. 필요하면 `<style>` 안의 `--accent`류 변수 값만 바꿔서 이 페이지만의 색을 입힙니다. 구조 변수(`--bg`/`--surface`/`--panel`/`--ink`/`--text`/`--line`/`--border`)는 그대로 두세요 — 다크모드 토글이 이 변수들에 의존합니다.
4. 섹션마다 `id`를 달아두면 오른쪽 아래 목차(📑) 위젯이 자동으로 인식합니다. 헤딩(`h2` 등)에 직접 `id`를 달거나, 헤딩을 감싼 `<section id="...">`에 달아도 됩니다.
5. `index.html`에 카드 링크를 추가합니다 (기존 카드 마크업 참고).
6. 다크/라이트 양쪽 모드로 한 번씩 열어서 새로 추가한 색이 두 모드 다 읽히는지 확인하세요.

## 모든 템플릿이 공유하는 것

- `../assets/site-header.css` + `../assets/theme.js` — 상단 고정 헤더, 다크모드 토글. `localStorage`에 저장되고 기본값은 다크입니다.
- `../assets/page-toc.css` + `../assets/page-toc.js` — 우측 하단 플로팅 목차 버튼. 페이지 안 `[id]` 요소를 스캔해서 자동으로 목록을 만듭니다. 섹션이 2개 미만이면 스스로 숨습니다.
- `<script>` 인라인 스니펫 (head 최상단) — 페이지가 그려지기 전에 저장된 테마를 적용해서 깜빡임(FOUC)을 막습니다. 반드시 `<style>`보다 먼저 와야 합니다.

이 세 파일(`site-header`, `theme`, `page-toc`)은 사이트 전역에서 하나만 관리하면 되므로, 색상만 다른 새 템플릿을 추가해도 헤더/토글/목차 동작은 자동으로 통일됩니다.
