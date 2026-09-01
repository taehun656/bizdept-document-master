import {
  renderFileList,
  renderOutline,
  renderTemplateOptions,
  setText,
} from "./view.js";
import { buildUploadQueue } from "./upload-plan.js";

(function () {
  "use strict";

  const toneLabels = {
    concise: "간결 결재형",
    standard: "표준 보고형",
    explanatory: "설명 강화형",
  };
  const densityLabels = {
    "one-page": "1쪽 요약형",
    standard: "표준형",
    "evidence-heavy": "근거 상세형",
  };
  const uploadCache = new Map();
  let templates = {};

  const elements = {
    form: document.querySelector("#documentForm"),
    projectName: document.querySelector("#projectName"),
    templateGrid: document.querySelector("#templateGrid"),
    referenceUpload: document.querySelector("#referenceUpload"),
    templateFiles: document.querySelector("#templateFiles"),
    templateFileList: document.querySelector("#templateFileList"),
    sourceFiles: document.querySelector("#sourceFiles"),
    sourceFileList: document.querySelector("#sourceFileList"),
    confirmButton: document.querySelector("#confirmButton"),
    formStatus: document.querySelector("#formStatus"),
    actionSummary: document.querySelector("#actionSummary"),
    successPanel: document.querySelector("#successPanel"),
    previewScope: document.querySelector("#previewScope"),
    previewTemplate: document.querySelector("#previewTemplate"),
    previewTopic: document.querySelector("#previewTopic"),
    previewPurpose: document.querySelector("#previewPurpose"),
    previewAudience: document.querySelector("#previewAudience"),
    previewTone: document.querySelector("#previewTone"),
    previewDensity: document.querySelector("#previewDensity"),
    previewFormat: document.querySelector("#previewFormat"),
    previewFileCount: document.querySelector("#previewFileCount"),
    previewOutline: document.querySelector("#previewOutline"),
  };

  function selectedValue(name) {
    return elements.form.querySelector(`[name="${name}"]:checked`)?.value ?? "";
  }

  function selectedOutputs() {
    return Array.from(elements.form.querySelectorAll('[name="output"]:checked')).map((input) => input.value);
  }

  function currentTemplate() {
    const id = selectedValue("template");
    if (id === "reference-template") {
      return {
        id,
        label: "내 양식 파일",
        outline: ["기존 양식 구조 확인", "원시자료 반영", "형식 및 내용 검증"],
      };
    }
    return { id, ...templates[id] };
  }

  function updatePreview() {
    const template = currentTemplate();
    const outputs = selectedOutputs();
    const sourceCount = buildUploadQueue(
      template?.id,
      elements.sourceFiles.files,
      elements.templateFiles.files,
    ).length;
    setText(elements.previewScope, `[${document.querySelector("#scope").value}]`, "[공통]");
    setText(elements.previewTopic, document.querySelector("#topic").value, "문서 주제를 입력하세요");
    setText(elements.previewPurpose, document.querySelector("#purpose").value, "작성 목적을 입력하면 결재자가 먼저 읽을 요약으로 반영됩니다.");
    setText(elements.previewAudience, document.querySelector("#audience").value, "사업부장");
    elements.previewTemplate.textContent = template?.label || "템플릿 선택";
    elements.previewTone.textContent = toneLabels[selectedValue("tone")] || "표준 보고형";
    elements.previewDensity.textContent = densityLabels[selectedValue("density")] || "표준형";
    elements.previewFormat.textContent = outputs.length ? outputs.map((item) => item.toUpperCase()).join(" + ") : "형식 선택 필요";
    elements.previewFileCount.textContent = `첨부 예정 ${sourceCount}건`;
    elements.actionSummary.textContent = outputs.length
      ? `${outputs.map((item) => item.toUpperCase()).join("와 ")} 문서 생성을 준비합니다.`
      : "출력 형식을 하나 이상 선택해 주세요.";

    const outline = template?.outline || ["문서 개요", "검토 내용", "결론"];
    renderOutline(elements.previewOutline, outline);

    const usingReference = template?.id === "reference-template";
    elements.referenceUpload.hidden = !usingReference;
  }

  function attachDropState(input) {
    const box = input.closest(".upload-box");
    for (const eventName of ["dragenter", "dragover"]) {
      box.addEventListener(eventName, () => box.classList.add("is-dragging"));
    }
    for (const eventName of ["dragleave", "drop"]) {
      box.addEventListener(eventName, () => box.classList.remove("is-dragging"));
    }
  }

  function setStatus(message, isError = false) {
    elements.formStatus.textContent = message;
    elements.formStatus.classList.toggle("is-error", isError);
  }

  function validateForm() {
    if (!elements.form.reportValidity()) return false;
    if (!selectedOutputs().length) {
      setStatus("출력 형식을 하나 이상 선택해 주세요.", true);
      document.querySelector('[name="output"]').focus();
      return false;
    }
    if (selectedValue("template") === "reference-template" && !elements.templateFiles.files.length) {
      setStatus("내 양식을 사용하려면 HWPX 또는 DOCX 양식 파일을 첨부해 주세요.", true);
      elements.templateFiles.focus();
      return false;
    }
    const invalidReference = selectedValue("template") === "reference-template"
      ? Array.from(elements.templateFiles.files).find((file) => !/\.(hwpx|docx)$/i.test(file.name))
      : null;
    if (invalidReference) {
      setStatus(`${invalidReference.name}: 참조 양식은 HWPX 또는 DOCX만 사용할\u00A0수\u00A0있습니다.`, true);
      return false;
    }
    const oversized = [...elements.sourceFiles.files, ...elements.templateFiles.files].find((file) => file.size > 50 * 1024 * 1024);
    if (oversized) {
      setStatus(`${oversized.name}: 파일당 최대 용량은 50MB입니다.`, true);
      return false;
    }
    return true;
  }

  async function uploadFile(file, role) {
    const cacheKey = `${role}:${file.name}:${file.size}:${file.lastModified}`;
    if (uploadCache.has(cacheKey)) return uploadCache.get(cacheKey);
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Filename": encodeURIComponent(file.name),
        "X-Upload-Role": role,
      },
      body: file,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `${file.name} 업로드에 실패했습니다.`);
    uploadCache.set(cacheKey, result);
    return result;
  }

  async function collectUploads() {
    const queue = buildUploadQueue(
      selectedValue("template"),
      elements.sourceFiles.files,
      elements.templateFiles.files,
    );
    const results = [];
    for (let index = 0; index < queue.length; index += 1) {
      const item = queue[index];
      setStatus(`첨부파일 저장 중 ${index + 1}/${queue.length}: ${item.file.name}`);
      results.push(await uploadFile(item.file, item.role));
    }
    return results;
  }

  function buildSelection(attachments) {
    const template = currentTemplate();
    return {
      version: 1,
      status: "confirmed",
      topic: {
        scope: document.querySelector("#scope").value,
        title: document.querySelector("#topic").value.trim(),
        purpose: document.querySelector("#purpose").value.trim(),
        audience: document.querySelector("#audience").value.trim(),
        notes: document.querySelector("#notes").value.trim(),
      },
      template: { id: template.id, label: template.label },
      style: { tone: selectedValue("tone"), density: selectedValue("density") },
      outputs: selectedOutputs(),
      attachments,
    };
  }

  async function submit(event) {
    event.preventDefault();
    setStatus("");
    if (!validateForm()) return;
    elements.confirmButton.disabled = true;
    elements.confirmButton.setAttribute("aria-busy", "true");
    elements.confirmButton.querySelector("span").textContent = "설정을 저장하는 중";
    try {
      const attachments = await collectUploads();
      setStatus("문서 설정을 저장하고 있습니다.");
      const response = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSelection(attachments)),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "문서 설정을 저장하지 못했습니다.");
      elements.form.hidden = true;
      elements.successPanel.hidden = false;
      elements.successPanel.querySelector("h2").focus?.();
    } catch (error) {
      setStatus(error.message || "문서 설정을 저장하지 못했습니다. 다시 시도해 주세요.", true);
      elements.confirmButton.disabled = false;
      elements.confirmButton.setAttribute("aria-busy", "false");
      elements.confirmButton.querySelector("span").textContent = "다시 시도하기";
    }
  }

  async function initialize() {
    try {
      const response = await fetch("/api/bootstrap");
      if (!response.ok) throw new Error("초기 설정을 읽을 수 없습니다.");
      const data = await response.json();
      templates = data.templates;
      elements.projectName.textContent = data.projectName;
      renderTemplateOptions(elements.templateGrid, templates);
      updatePreview();
    } catch (error) {
      elements.templateGrid.textContent = error.message;
      setStatus("템플릿 목록을 불러오지 못했습니다. 대화 화면에서 설정을 계속해 주세요.", true);
    }
  }

  elements.form.addEventListener("input", updatePreview);
  elements.form.addEventListener("change", (event) => {
    if (event.target === elements.sourceFiles) renderFileList(elements.sourceFiles, elements.sourceFileList);
    if (event.target === elements.templateFiles) renderFileList(elements.templateFiles, elements.templateFileList);
    updatePreview();
  });
  elements.form.addEventListener("submit", submit);
  attachDropState(elements.sourceFiles);
  attachDropState(elements.templateFiles);
  initialize();
})();
