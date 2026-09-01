# Business Document Setup UI Design Contract

## 0. Research Log

- Structural reference: `taehun656/slide-master` Confirm UI. Reused the local-loopback workflow of “recommendation/selection screen → confirmed JSON handoff → server shutdown,” while adapting fields and visual hierarchy to business documents.
- Interaction references: beUI Checkbox, File Upload, and Button source pages. Adopted explicit selected states, visible async progress, file rows, retryable errors, and reduced-motion handling without copying its React/Tailwind implementation.
- Visual direction: minimalist document desk. Lazyweb and image generation were skipped because the user supplied a concrete workflow reference and the surface needs no decorative imagery.

## 1. Intent and Product Feel

The screen should feel like a calm document-preparation desk, not a generic admin dashboard. A user who does not know the template taxonomy should be able to type the document topic, choose a clearly explained template, attach source material, and understand the expected output before confirming.

The primary action is “이 설정으로 문서 만들기.” Everything on screen supports that decision.

## 2. Personas and Critical Tasks

1. Business manager unfamiliar with templates: enters a topic and purpose, compares six plain-language template cards, and accepts the recommended-looking standard defaults.
2. Keyboard-only reviewer: reaches every field, option, upload control, and final button in logical order with a visible focus ring.
3. Low-vision user at 200% zoom: reads one reflowed column with no horizontal scrolling and can distinguish selection without relying on color alone.

Critical path: topic → template → writing style and outputs → source/template attachments → confirm → `spec/ui-selection.json`.

## 3. Visual System

- Atmosphere: off-white workspace, white paper, ink-like text, one restrained cobalt accent.
- Typography: UI uses `Pretendard`, `Apple SD Gothic Neo`, `Noto Sans KR`, sans-serif. The paper preview uses `Noto Serif KR`, `AppleMyungjo`, Georgia, serif for the title only.
- Colors: `#F2F0EB` workspace, `#FFFFFF` paper/surface, `#172033` primary text, `#667085` secondary text, `#D8D5CE` borders, `#1F5FBF` accent, `#EAF1FB` selected wash, `#B42318` error, `#067647` success.
- Depth: borders and tonal changes only. No gradients and no decorative shadows.
- Radius: 4px controls, 8px cards, 12px major panels. Pills are reserved for compact status tags.
- Motion: 120ms selection and press feedback; no autonomous or looping motion. Respect `prefers-reduced-motion`.

## 4. Information Architecture

The desktop shell has two equal-priority regions:

- Preview pane: sticky header context plus one paper preview. The pane owns its vertical scroll.
- Settings pane: numbered sections for topic, template, style/output, and materials. The pane owns its vertical scroll and ends with a fixed-in-flow confirmation area.

At narrow widths the shell becomes a single document scroll: preview first, settings second. No nested scrollbars remain.

## 5. Layout Contract

- Desktop shell: `grid-template-rows: auto minmax(0, 1fr)` bounded by `100dvh`.
- Workspace: `grid-template-columns: minmax(20rem, 0.88fr) minmax(28rem, 1.12fr)`.
- Both desktop panes use `min-block-size: 0; overflow: auto`.
- Template cards use `repeat(auto-fit, minmax(min(15rem, 100%), 1fr))`.
- Under 900px, use a single column and document-level scrolling.
- At 375px, controls and action buttons fill the available width. Long filenames and URLs use `overflow-wrap: anywhere`.

## 6. Components and States

- Template card: native radio remains the semantic control; the label supplies title, summary, section outline, and a visible check mark when selected.
- Choice control: native radios and checkboxes with both border and icon/text changes.
- Upload box: native file input layered over a labeled drop area; states are empty, files selected, uploading, uploaded, and error. File names, sizes, and roles remain visible.
- Confirm button: idle, busy (`aria-busy=true`), success, and error. The button is disabled only during an active submission.
- Preview paper: reacts to topic, scope, audience, template outline, tone, density, and output formats.
- Status region: `aria-live="polite"` reports uploads, validation errors, and final save location.

## 7. Interaction Rules

- Template selection is a single radio group. “내 양식 파일” reveals and requires a HWPX or DOCX reference file.
- HWPX and DOCX are independent checkboxes, with at least one required.
- Files are uploaded only after final confirmation begins, preventing abandoned uploads during exploration.
- If an upload fails, confirmation stops, the server remains available, and the user can retry.
- Successful confirmation writes one normalized JSON file and then the loopback server shuts down.
- Browser launch failure falls back to the same questions in chat; UI use is preferred, never mandatory.

## 8. Accessibility and Verification

- Every input has a programmatic label; grouped choices use `fieldset` and `legend`.
- Focus order follows the numbered sections. Focus rings meet contrast requirements.
- Target size is at least 44px for primary controls.
- Selection never depends on color alone.
- Test at 375px, 768px, and 1280px; at 200% zoom; with keyboard-only navigation; with reduced motion; with empty, long, and unbroken content; and through the complete confirm/save flow.
