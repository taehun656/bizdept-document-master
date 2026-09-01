# 문서 생성 워크플로우

## 프로젝트 구조

```text
<project>/
├── sources/
│   ├── uploads/              UI에서 확정한 원시자료
│   ├── reference/            사용자가 선택한 기존 양식
│   └── source_summary.md     파싱 결과 요약
├── spec/
│   ├── ui-selection.json     UI에서 확정한 주제·템플릿·스타일
│   ├── document_spec.md      사람이 검토하는 문서 계획
│   └── spec_lock.yaml        생성기가 따르는 잠금 값
├── draft/
│   └── content.md            HWPX·DOCX 공통 내용 원본
├── outputs/                  최종 산출물만 저장
└── qa/                       렌더, 추출문, 검사 결과
```

`ui-selection.json`이 있으면 그 값을 사용자 확인이 끝난 설정으로 취급한다. `document_spec.md`와 `spec_lock.yaml`은 이 파일을 그대로 복사하지 않고 원시자료 분석 결과, 필수 결재 필드, 선택한 템플릿 프리셋을 합쳐 정규화한다. UI에서 선택한 제목·템플릿·스타일·출력 형식은 원천자료만으로 임의 변경하지 않는다.

## document_spec.md

다음 항목을 짧은 문장으로 확정한다.

1. 문서 목적과 독자
2. 업무 유형과 템플릿 ID
3. 결재자가 결정해야 하는 사항
4. 핵심 사실과 근거 출처
5. 시행일·응답기한·담당자
6. 비용·운영상 영향·위험
7. 관련 기안번호와 첨부자료
8. 출력 형식과 보안 수준

## spec_lock.yaml

```yaml
document:
  template_id: "daily-work-report"
  scope: "공통"
  title: "[공통] 사업부 일일업무보고"
  document_id: ""
  report_date: "YYYY-MM-DD"
  effective_date: ""
  related_document_id: ""
  decision_required: false
  decision_request: "의사결정 요청 없음"
outputs:
  formats: ["hwpx", "docx"]
  hwpx_preset: "보고서"
  hwpx_body_pt: 10
  hwpx_line_spacing_percent: 160
  word_preset: "standard_business_brief"
  word_header_pattern: "memo_masthead"
  word_korean_font: "Arial Unicode MS"
layout:
  approval_cover: true
  body_start_new_page: true
render:
  macos_fontconfig: "assets/fontconfig-macos-korean.xml"
content:
  source_summary: "sources/source_summary.md"
  canonical_markdown: "draft/content.md"
attachments: []
quality:
  require_hwp_validation: true
  require_hwp_render_review: true
  require_docx_render_review: true
  forbid_placeholders: true
privacy:
  classification: "내부"
  minimize_personal_data: true
```

결재 요청이 필요한데 `decision_request`가 비어 있거나, 시행일이 중요한 업무에서 `effective_date`가 비어 있으면 생성 단계로 넘어가지 않는다.

`approval_cover`와 `body_start_new_page`가 모두 `true`이면 표지 뒤에 명시적인 페이지 나눔을 넣는다. HWPX는 첫 본문 제목 문단의 `pageBreak="1"`을 사용하고, DOCX는 표지 마지막 요소 뒤에 페이지 나눔을 넣는다. 내용이 짧더라도 표지 아래 남은 공간에 본문 제목만 고립시키지 않는다.

DOCX의 한글 글꼴은 목표 Word 환경에 설치된 글꼴을 `ascii`, `hAnsi`, `eastAsia`에 동일하게 지정한다. 이 macOS 환경에서는 `Arial Unicode MS`를 사용한다. 번들 LibreOffice 렌더러를 호출할 때는 `FONTCONFIG_FILE=<skill>/assets/fontconfig-macos-korean.xml`을 함께 지정해 시스템 한글 글꼴이 실제 렌더러에 노출되도록 한다.

## 확인 게이트

다음 경우에만 명세를 사용자에게 한 번 확인한다.

- 처음 만드는 업무 유형 또는 기존 템플릿 구조 변경
- 계약 금액, 법적 의무, 대외 회신, 운행 시행일처럼 오류의 영향이 큰 값이 불명확함
- 결재 요청과 단순 보고 중 어느 쪽인지 원천자료만으로 판단할 수 없음
- HWP 요청을 HWPX로 대체해야 함

반복 보고에서 템플릿과 필수 값이 모두 확정되어 있으면 확인을 생략하고 생성·검증까지 진행한다.

## 파일명 규칙

`YYYY-MM-DD_[범위]_[업무유형]_[핵심제목]_vNN.ext`

예: `2026-09-01_[공통]_일일업무보고_v01.docx`

동일한 버전을 HWPX와 DOCX에 사용하고, 기존 파일을 덮어쓰지 않는다.
