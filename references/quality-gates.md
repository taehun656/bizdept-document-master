# 품질 게이트

## 공통 내용 검사

1. 제목, 문서번호, 일자, 수치, 결재 요청을 원천자료와 대조한다.
2. `content.md`, HWPX, DOCX에서 동일한 핵심 사실이 유지되는지 확인한다.
3. `{{...}}`, `○○`, `TBD`, 불완전한 날짜 등 placeholder가 남아 있지 않은지 확인한다.
4. 첨부파일명이 실제 파일과 일치하고 관련 기안번호가 정확한지 확인한다.
5. 한국어 산출물은 `vendor/fluent-korean/fluent-korean.md` 지침으로 최종 교정한다.

## HWPX 게이트

새 문서는 `scripts/run-kordoc.sh generate`로 만들고 `validate`와 `render`를 실행한다. `kordoc@4.12.0`은 조판(reflow)이 기본으로 켜져 있다. SVG 미리보기에서 모든 쪽을 확인한다.

기존 HWPX 양식을 채우는 경우에는 `scripts/run-hwpx.sh`의 슬롯 추출과 구조 보존 편집을 사용하고 다음 검사를 모두 통과한다.

- `validate.py`
- `fix_namespaces.py`
- `finalize_hwpx.py --strip-linesegarray --layout`
- `page_guard.py`
- `content_guard.py`

레퍼런스 작업은 원본과 쪽수가 같아야 하며 표 병합, 스타일 참조, 패키지 구조를 임의로 바꾸지 않는다.

공통 결재 표지를 사용하는 신규 문서는 표지 뒤 첫 본문 제목 문단에 `pageBreak="1"`이 있는지 확인한다. 렌더에서 표지 하단에 본문 제목만 고립되거나 본문 표가 다음 쪽에서 시작하면 실패로 판정한다.

## DOCX 게이트

`$documents` 스킬의 생성 절차를 사용한다. 사업부 내부 결재 문서는 기본적으로 `standard_business_brief`와 `memo_masthead`를 사용하되, 기존 Word 양식이 있으면 기존 양식을 우선한다.

생성 후 `render_docx.py`로 모든 페이지를 PNG로 렌더하고 다음을 확인한다.

macOS의 번들 LibreOffice는 기본 Fontconfig에서 시스템 한글 글꼴을 보지 못할 수 있다. 이 환경에서는 다음과 같이 스킬의 Fontconfig를 명시한다.

```bash
FONTCONFIG_FILE=<skill>/assets/fontconfig-macos-korean.xml \
  <bundled-python> <documents-skill>/render_docx.py <input.docx> \
  --output_dir <qa-dir> --emit_pdf
```

한글이 사라지거나 같은 음절로 반복되면 문서 내용을 다시 쓰지 않는다. 먼저 DOCX의 `word/document.xml`에 원문이 있는지 확인하고, PDF가 요청 글꼴 대신 `FrankRuhlHofshi`나 `LinuxLibertine`을 사용했는지 검사한다. Fontconfig 적용 후 PDF 추출문에 문서 제목이 정확히 존재해야 한다.

- 제목과 표가 페이지 밖으로 잘리지 않음
- 표 셀의 글자가 경계에 붙거나 겹치지 않음
- 한글 글꼴이 깨지거나 대체되지 않음
- 머리글·바닥글과 페이지 번호가 일관됨
- 큰 빈 공간이나 의도하지 않은 빈 페이지가 없음
- 공통 결재 표지를 사용한 경우 본문이 다음 쪽에서 시작함

## 완료 판정

구조 검증이 성공했더라도 시각 검토에서 결함이 있으면 완료가 아니다. 수정 후 다시 렌더하고 모든 쪽을 재검토한다.
