export function renderTemplateOptions(container, templates) {
  const entries = Object.entries(templates);
  const cards = entries.map(([id, item], index) => templateCard(id, item, index + 1, index === 0));
  cards.push(templateCard("reference-template", {
    label: "내 양식 파일",
    summary: "기존 HWPX 또는 DOCX 양식을 기준으로 새 문서를 작성합니다.",
    outline: ["기존 구조 보존", "내용 교체", "시각 검증"],
  }, entries.length + 1, false));
  container.innerHTML = cards.join("");
}

function templateCard(id, template, index, checked) {
  const outline = Array.isArray(template.outline) ? template.outline.slice(0, 3).join(" · ") : "";
  return `
    <label class="template-option">
      <input type="radio" name="template" value="${id}" ${checked ? "checked" : ""}>
      <span class="template-card">
        <span class="template-card-head">
          <span class="template-index">TYPE ${String(index).padStart(2, "0")}</span>
          <span class="template-check"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8 3 3 6-6"/></svg></span>
        </span>
        <b>${template.label}</b>
        <p>${template.summary}</p>
        <span class="template-outline">${outline}</span>
      </span>
    </label>`;
}

export function setText(element, value, fallback) {
  element.textContent = value?.trim() || fallback;
}

export function renderOutline(container, outline) {
  container.replaceChildren(...outline.map((label) => {
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = label;
    item.append(text);
    return item;
  }));
}

export function renderFileList(input, list) {
  list.replaceChildren(...Array.from(input.files).map((file) => {
    const row = document.createElement("li");
    const name = document.createElement("span");
    const size = document.createElement("span");
    name.textContent = file.name;
    size.textContent = formatBytes(file.size);
    row.append(name, size);
    return row;
  }));
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
