import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const VALID_OUTPUTS = new Set(["hwpx", "docx"]);
const REFERENCE_EXTENSIONS = new Set([".hwpx", ".docx"]);
const VALID_ROLES = new Map([
  ["source", path.join("sources", "uploads")],
  ["template-reference", path.join("sources", "reference")],
]);

function requireText(value, label, maxLength = 4000) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}을(를) 입력해 주세요.`);
  }
  return value.trim().slice(0, maxLength);
}

function isReferenceDocument(fileName) {
  return REFERENCE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

export function sanitizeFileName(value) {
  const normalized = String(value ?? "").replaceAll("\\", "/");
  const baseName = path.posix.basename(normalized);
  const cleaned = baseName
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/^\.+$/, "")
    .trim();
  return cleaned.slice(0, 180) || "attachment";
}

export function validateSelection(value, templateIds) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("문서 설정값이 올바르지 않습니다.");
  }

  const topic = value.topic;
  const template = value.template;
  const style = value.style;
  if (!topic || typeof topic !== "object") {
    throw new Error("문서 주제 정보를 입력해 주세요.");
  }
  if (!template || typeof template !== "object") {
    throw new Error("템플릿을 선택해 주세요.");
  }
  if (!style || typeof style !== "object") {
    throw new Error("작성 스타일을 선택해 주세요.");
  }

  requireText(topic.title, "문서 주제", 200);
  requireText(topic.scope, "문서 범위", 20);
  requireText(topic.purpose, "작성 목적", 2000);
  requireText(topic.audience, "보고 대상", 200);

  const templateId = requireText(template.id, "템플릿", 100);
  if (!templateIds.has(templateId)) {
    throw new Error("선택한 템플릿을 사용할 수 없습니다.");
  }

  requireText(style.tone, "문장 스타일", 40);
  requireText(style.density, "문서 분량", 40);

  if (!Array.isArray(value.outputs) || value.outputs.length === 0) {
    throw new Error("출력 형식을 하나 이상 선택해 주세요.");
  }
  if (value.outputs.some((output) => !VALID_OUTPUTS.has(output))) {
    throw new Error("지원하지 않는 출력 형식이 포함되어 있습니다.");
  }

  if (!Array.isArray(value.attachments)) {
    throw new Error("첨부파일 목록이 올바르지 않습니다.");
  }
  for (const attachment of value.attachments) {
    if (!attachment || typeof attachment !== "object") {
      throw new Error("첨부파일 정보가 올바르지 않습니다.");
    }
    requireText(attachment.name, "첨부파일 이름", 180);
    requireText(attachment.path, "첨부파일 경로", 500);
    if (!VALID_ROLES.has(attachment.role)) {
      throw new Error("첨부파일 역할이 올바르지 않습니다.");
    }
    if (
      attachment.role === "template-reference" &&
      (!isReferenceDocument(attachment.name) || !isReferenceDocument(attachment.path))
    ) {
      throw new Error("참조 양식은 HWPX 또는 DOCX 파일이어야 합니다.");
    }
  }

  if (
    templateId === "reference-template" &&
    !value.attachments.some((item) => item.role === "template-reference")
  ) {
    throw new Error("내 양식을 사용하려면 HWPX 또는 DOCX 양식 파일을 첨부해 주세요.");
  }

  return value;
}

export async function storeUpload(projectRoot, role, originalName, buffer) {
  const relativeDirectory = VALID_ROLES.get(role);
  if (!relativeDirectory) {
    throw new Error("지원하지 않는 첨부파일 역할입니다.");
  }

  const safeName = sanitizeFileName(originalName);
  if (role === "template-reference" && !isReferenceDocument(safeName)) {
    throw new Error("참조 양식은 HWPX 또는 DOCX 파일이어야 합니다.");
  }
  const targetDirectory = path.resolve(projectRoot, relativeDirectory);
  await mkdir(targetDirectory, { recursive: true });

  const extension = path.extname(safeName);
  const stem = path.basename(safeName, extension);
  let candidate = path.join(targetDirectory, safeName);
  let suffix = 2;
  while (true) {
    try {
      await writeFile(candidate, buffer, { flag: "wx" });
      break;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      candidate = path.join(targetDirectory, `${stem} (${suffix})${extension}`);
      suffix += 1;
    }
  }

  return {
    role,
    name: path.basename(candidate),
    path: path.relative(projectRoot, candidate).split(path.sep).join("/"),
    size: buffer.byteLength,
  };
}

export async function saveSelection(projectRoot, selection) {
  const specDirectory = path.resolve(projectRoot, "spec");
  await mkdir(specDirectory, { recursive: true });
  const destination = path.join(specDirectory, "ui-selection.json");
  const temporary = path.join(specDirectory, `.ui-selection.${process.pid}.tmp`);
  const payload = {
    ...selection,
    version: 1,
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
  };
  await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(temporary, destination);
  return destination;
}
