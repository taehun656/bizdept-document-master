# 통합 구성요소 사용법

## 시작 전 확인

스킬 루트에서 다음 명령을 실행한다.

```bash
scripts/doctor.sh
```

`PASS: bizdept-document-master is ready`가 출력되지 않으면 문서 작업을 시작하지 않는다. 전역에 같은 이름의 스킬이 있더라도 통합 폴더 안의 구성요소만 사용한다.

## kordoc 기능

입력 문서 파싱, 신규 HWPX 생성, 구조 검증, SVG 렌더에는 다음 래퍼를 사용한다.

```bash
scripts/run-kordoc.sh <kordoc arguments>
```

예시:

```bash
scripts/run-kordoc.sh input.pdf -o sources/input.md
scripts/run-kordoc.sh generate draft/content.md -o outputs/report.hwpx --preset 보고서
scripts/run-kordoc.sh validate outputs/report.hwpx
scripts/run-kordoc.sh render outputs/report.hwpx -o qa/report.svg
```

런타임은 설치 폴더의 `vendor/kordoc/runtime`에 고정되어 있으며 전역 `npx` 캐시를 사용하지 않는다.

## HWPX 구조 보존 기능

기존 HWPX 레퍼런스의 슬롯 추출, 구조 보존 편집, 쪽수와 내용 검사는 다음 래퍼를 사용한다.

```bash
scripts/run-hwpx.sh <script.py> <arguments>
```

예시:

```bash
scripts/run-hwpx.sh hwpx_slots.py reference.hwpx -o qa/slots.json
scripts/run-hwpx.sh edit_hwpx.py reference.hwpx -o outputs/result.hwpx --slot-json values.json
scripts/run-hwpx.sh validate.py outputs/result.hwpx
scripts/run-hwpx.sh page_guard.py --reference reference.hwpx --output outputs/result.hwpx
scripts/run-hwpx.sh content_guard.py outputs/result.hwpx --rules qa/content.rules.json
```

세부 XML 규칙은 `vendor/hwpx/SKILL.md`를 해당 작업에서만 읽는다. 바이너리 `.hwp`는 읽기 참고만 가능하며 생성하거나 직접 편집하지 않는다.

## 한국어 작성 기능

보고서, 공문, 결재문, 설명문을 작성하거나 최종 교정하기 전에 `vendor/fluent-korean/fluent-korean.md`를 처음부터 끝까지 읽고 적용한다. 코드, 로그, 외국어 원문, 직접 인용문에는 적용하지 않는다.

## Word 기능

DOCX는 Codex에 기본 제공되는 `$documents` 스킬을 사용한다. 통합 설치기는 외부 사용자 스킬 세 개만 조립하며 Codex 시스템 스킬을 덮어쓰지 않는다. `$documents`가 없는 Codex 호환 환경에서는 DOCX 생성을 완료했다고 주장하지 말고, 해당 환경에 맞는 Word 생성 도구를 먼저 준비한다.
