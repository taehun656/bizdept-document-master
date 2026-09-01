# bizdept-document-master

사업부 결재·보고 문서를 HWPX와 DOCX로 생성하기 위한 원스탑 Codex 스킬입니다. `kordoc`, `hwpxskill`, `fluent-korean` 기능을 설치 과정에서 하나의 스킬 폴더에 조립합니다.

## 한 번에 설치하기

macOS 또는 Linux에서 다음 명령을 한 번 실행합니다.

```bash
bash -c 'workdir=$(mktemp -d); git clone --depth 1 https://github.com/taehun656/bizdept-document-master.git "$workdir/repo" && "$workdir/repo/scripts/install.sh"'
```

설치 위치는 `${CODEX_HOME:-$HOME/.codex}/skills/bizdept-document-master`입니다. 기존 설치가 있으면 덮어쓰지 않고 중단합니다.

설치 후 새 Codex 작업에서 다음처럼 사용합니다.

```text
$bizdept-document-master 사업부 폴더의 결재 PDF와 첨부파일을 분석하고, 일일업무보고를 HWPX와 DOCX로 만들어줘.
```

## 포함되는 기능

- PDF·HWP·HWPX·DOCX·XLSX 파싱과 신규 HWPX 생성
- 기존 HWPX 양식의 구조·쪽수 보존 편집
- 한국어 보고서와 공문 문장 교정
- 사업부 업무 유형별 6개 본문 템플릿과 공통 결재표지
- HWPX 구조·내용·렌더 검증과 DOCX 시각 검증 절차

DOCX 생성은 Codex에 기본 제공되는 `documents` 시스템 스킬을 사용합니다. 바이너리 `.hwp` 파일은 생성하거나 직접 편집하지 않으며, 한글 편집 산출물은 `.hwpx`로 만듭니다.

## 설치 요구사항

- Git
- Node.js 18 이상과 npm
- Python 3
- 인터넷 연결

설치기는 고정된 원본 커밋과 `kordoc@4.12.0`, `lxml==6.0.1`을 사용합니다. 자세한 버전은 `references/upstream-lock.json`에서 확인할 수 있습니다.

## 상태 확인

```bash
${CODEX_HOME:-$HOME/.codex}/skills/bizdept-document-master/scripts/doctor.sh
```

`PASS: bizdept-document-master is ready`가 출력되면 설치가 완료된 상태입니다.

## 라이선스

이 저장소의 자체 작성 부분은 MIT 라이선스로 배포합니다. 외부 구성요소의 출처와 라이선스 처리 방식은 `THIRD_PARTY.md`를 확인하십시오.
