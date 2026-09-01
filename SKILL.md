---
name: bizdept-document-master
description: 사업부의 결재·보고 문서를 공통 결재표지와 업무별 본문 템플릿으로 구조화하여 HWPX와 Word DOCX로 생성하거나 기존 양식을 채울 때 사용한다. 일일업무, 노선·인허가, 민원·대외회신, 계약·시설, 손익·재정·데이터, 현장운영 보고에 적용한다.
---

# 사업부 문서 마스터

사업부 원시 결재문서에서 확인된 `결재 요약 + 근거 첨부` 구조를 재사용 가능한 문서로 만든다. 하나의 정규화된 내용 원본에서 HWPX와 DOCX를 생성하여 두 형식의 사실과 결론이 달라지지 않게 한다.

## 형식 경계

- 한글 편집 문서의 기본 산출물은 `.hwpx`이다.
- 바이너리 `.hwp`를 직접 생성하거나 편집했다고 주장하지 않는다. 사용자가 `.hwp`를 명시하면 HWPX 대체가 가능한지 먼저 확인한다.
- Word 산출물은 `.docx`로 만든다.
- 두 형식을 요청받으면 동일한 `content.md`와 `spec_lock.yaml`을 사용하여 각각 생성한다.
- 원본 결재문서와 첨부파일은 덮어쓰지 않는다.

## 통합 구성요소

이 스킬은 설치 후 다음 구성요소를 자기 폴더 안에서 사용한다. 별도의 `$kordoc`, `$hwpx`, `$fluent-korean` 설치본을 찾거나 호출하지 않는다.

- 입력 HWP/HWPX/PDF/DOCX/XLSX 파싱과 새 HWPX 생성: `scripts/run-kordoc.sh`
- 레퍼런스 HWPX의 구조와 쪽수를 보존하는 편집: `scripts/run-hwpx.sh`
- 한국어 문장 작성과 최종 교정: `vendor/fluent-korean/fluent-korean.md`
- Word DOCX 생성과 렌더 검증: Codex 기본 `$documents` 스킬

작업을 시작하기 전에 `scripts/doctor.sh`가 통과하는지 확인한다. 통합 구성요소의 경로와 선택 기준은 `references/integrated-components.md`를 읽는다. 구성요소가 없으면 전역 스킬로 임의 대체하지 말고 설치를 다시 실행한다.

## 문서 설정 UI

사용자가 새 문서를 만들면서 주제·템플릿·스타일을 화면에서 고르기를 원하면 `references/ui-workflow.md`를 읽고 로컬 설정 UI를 우선 사용한다.

```bash
node <skill-root>/scripts/document-ui/server.mjs <project-path>
```

브라우저에서 다음을 한 화면에서 설정할 수 있다.

- 문서 범위, 제목, 작성 목적, 보고 대상과 추가 지시
- 6개 업무 템플릿 또는 사용자가 올린 HWPX·DOCX 양식
- 간결 결재형·표준 보고형·설명 강화형 문장 스타일
- 1쪽 요약형·표준형·근거 상세형 문서 구성
- HWPX·DOCX 출력 형식
- 결재 PDF, HWP/HWPX, DOCX, XLSX 등 원시자료와 근거 첨부

확정 결과는 `<project-path>/spec/ui-selection.json`에 저장된다. 이를 사용자 확정값으로 취급하여 `document_spec.md`와 `spec_lock.yaml`로 정규화하고, 원천자료 분석과 생성 작업을 계속한다. 브라우저가 열리지 않거나 로컬 서버를 사용할 수 없으면 같은 항목을 대화에서 한 번에 물어보는 방식으로 전환한다. UI 실패 때문에 문서 생성을 중단하지 않는다.

## 작업 순서

이 순서는 slide-master의 `원천 정리 → 프로젝트 초기화 → 템플릿 선택 → 명세 잠금 → 순차 생성 → 품질 검사 → 내보내기` 구조를 문서 작업에 맞게 적용한 것이다.

1. **원천 정리**: `scripts/run-kordoc.sh`로 입력 파일을 읽고 사실, 요청사항, 관련 문서번호, 시행일, 금액, 첨부 근거를 `source_summary.md`로 정리한다.
2. **작업 폴더 초기화**: `sources/`, `spec/`, `draft/`, `outputs/`, `qa/`를 사용한다. 임시 변환물은 `qa/`에 두고 최종 산출물과 섞지 않는다.
3. **템플릿 선택**: 사용자가 UI 선택을 원하면 문서 설정 UI를 열고, 그렇지 않으면 `assets/template-manifest.json`에서 업무 유형을 고른다. 공통 표지와 해당 본문 템플릿을 결합한다. 세부 기준은 `references/business-templates.md`를 읽는다.
4. **명세 잠금**: `references/workflow.md`의 형식으로 `spec/document_spec.md`와 `spec/spec_lock.yaml`을 만든다. 새 유형, 비용·법적 효력, 결재 요청이 불명확한 경우에만 사용자 확인을 받는다. 반복 업무에서 잠긴 명세와 입력값이 충분하면 중간 확인 없이 진행한다.
5. **내용 작성**: `draft/content.md`를 유일한 내용 원본으로 작성하고 `vendor/fluent-korean/fluent-korean.md`를 적용해 교정한다. 결재 요청, 핵심 사실, 영향·비용·위험, 시행일, 관련 기안, 첨부 목록을 먼저 확정한다.
6. **형식별 생성**: 신규 HWPX는 `scripts/run-kordoc.sh`, 기존 HWPX 양식 편집은 `scripts/run-hwpx.sh`, DOCX는 Codex 기본 `$documents`를 사용한다. HWPX와 DOCX를 차례로 생성하며, 한 형식의 레이아웃을 맞추기 위해 사실이나 결론을 임의로 줄이지 않는다.
7. **품질 검사와 내보내기**: `references/quality-gates.md`의 구조·내용·시각 검사를 통과한 파일만 `outputs/`에 버전 번호와 함께 저장한다.

## 템플릿 라우팅

- 일일·주간 업무현황: `daily-work-report`
- 노선 변경, 운임, 운송개시, 인허가·신고: `route-license-report`
- 민원, 기관 의견조회, 대외 회신: `complaint-external-response`
- 계약 체결·변경, 시설·임차·용역: `contract-facility-approval`
- 계통별 손익, 정산, 지원금, 데이터 제출: `finance-data-report`
- 배차, 차량, 터미널, 현장 운행 변경: `field-operations-change`
- 휴가신청은 기존 인사 양식을 재사용하며 이 스킬의 신규 업무 템플릿으로 만들지 않는다.

## 작성 원칙

- 표지는 결재자가 결정에 필요한 정보만 한 페이지 안에서 빠르게 파악하도록 작성한다.
- 첨부파일은 결론을 반복하지 않고 계산, 변경 전후 비교, 노선도, 계약 조항, 증빙 등 근거를 담당한다.
- 의사결정 요청이 없으면 공란 대신 `의사결정 요청 없음`이라고 적는다.
- 변경 보고는 `변경 전`, `변경 후`, `변경 사유`, `시행일`, `영향`을 같은 구조에서 비교한다.
- 제목 범위는 `[공통]`, `[충남]`, `[한양]` 중 하나로 통일하고 파일명에도 같은 범위를 사용한다.
- 문서번호를 결재 본문과 첨부파일을 연결하는 기본 키로 사용한다.
- 전화번호, 계좌번호, 서명, 인감, 개인 휴가정보 등 민감정보는 필요한 문서에만 넣고 QA 로그에는 복제하지 않는다.

## 완료 조건

- `content.md`, HWPX, DOCX 사이의 제목·수치·일자·결재 요청이 일치한다.
- HWPX는 구조 검증과 렌더 검토를 통과한다.
- DOCX는 모든 페이지를 PNG로 렌더하여 겹침, 잘림, 표 파손, 한글 글꼴 대체가 없는지 확인한다.
- 금지된 placeholder와 원문 잔재가 없다.
- 최종 파일만 사용자에게 제공하고 QA 중간물은 제공하지 않는다.
