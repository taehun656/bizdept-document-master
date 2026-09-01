import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  saveSelection,
  sanitizeFileName,
  storeUpload,
  validateSelection,
} from "../scripts/document-ui/core.mjs";
import { buildUploadQueue } from "../scripts/document-ui/upload-plan.js";

const templates = new Set(["daily-work-report", "reference-template"]);

function validSelection() {
  return {
    version: 1,
    status: "confirmed",
    topic: {
      scope: "공통",
      title: "2026년 9월 일일업무보고",
      purpose: "주요 현안과 의사결정 사항을 보고한다.",
      audience: "사업부장",
      notes: "수치 근거를 우선한다.",
    },
    template: { id: "daily-work-report", label: "일일·주간 업무현황" },
    style: { tone: "concise", density: "standard" },
    outputs: ["hwpx", "docx"],
    attachments: [],
  };
}

test("sanitizeFileName strips paths and control characters", () => {
  assert.equal(sanitizeFileName("../../계약서\u0000 최종.pdf"), "계약서 최종.pdf");
  assert.equal(sanitizeFileName(".."), "attachment");
});

test("validateSelection accepts a complete built-in template selection", () => {
  const result = validateSelection(validSelection(), templates);
  assert.equal(result.topic.title, "2026년 9월 일일업무보고");
  assert.deepEqual(result.outputs, ["hwpx", "docx"]);
});

test("validateSelection rejects missing decisions and unknown templates", () => {
  const missingTitle = validSelection();
  missingTitle.topic.title = " ";
  assert.throws(() => validateSelection(missingTitle, templates), /문서 주제/);

  const unknownTemplate = validSelection();
  unknownTemplate.template.id = "unknown";
  assert.throws(() => validateSelection(unknownTemplate, templates), /템플릿/);

  const noOutputs = validSelection();
  noOutputs.outputs = [];
  assert.throws(() => validateSelection(noOutputs, templates), /출력 형식/);
});

test("reference template requires an uploaded reference attachment", () => {
  const selection = validSelection();
  selection.template.id = "reference-template";
  assert.throws(() => validateSelection(selection, templates), /양식 파일/);

  selection.attachments.push({
    role: "template-reference",
    name: "기존양식.hwpx",
    path: "sources/reference/기존양식.hwpx",
    size: 120,
  });
  assert.equal(validateSelection(selection, templates).template.id, "reference-template");
});

test("reference template rejects non-HWPX and non-DOCX files at both boundaries", async () => {
  const selection = validSelection();
  selection.template.id = "reference-template";
  selection.attachments.push({
    role: "template-reference",
    name: "기존양식.pdf",
    path: "sources/reference/기존양식.pdf",
    size: 120,
  });
  assert.throws(() => validateSelection(selection, templates), /HWPX 또는 DOCX/);

  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "bizdept-ui-test-"));
  await assert.rejects(
    storeUpload(projectRoot, "template-reference", "기존양식.txt", Buffer.from("bad")),
    /HWPX 또는 DOCX/,
  );
});

test("uploads stay inside the project and confirmed JSON is written atomically", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "bizdept-ui-test-"));
  const upload = await storeUpload(
    projectRoot,
    "source",
    "../원시자료.pdf",
    Buffer.from("source data"),
  );
  assert.equal(upload.path, "sources/uploads/원시자료.pdf");
  assert.equal(await readFile(path.join(projectRoot, upload.path), "utf8"), "source data");

  const savedPath = await saveSelection(projectRoot, validSelection());
  const saved = JSON.parse(await readFile(savedPath, "utf8"));
  assert.equal(saved.status, "confirmed");
  assert.match(saved.confirmedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("switching back to a built-in template excludes the hidden reference file", () => {
  const sourceFiles = [{ name: "결재.pdf" }];
  const templateFiles = [{ name: "기존양식.hwpx" }];

  assert.deepEqual(buildUploadQueue("daily-work-report", sourceFiles, templateFiles), [
    { file: sourceFiles[0], role: "source" },
  ]);
  assert.deepEqual(buildUploadQueue("reference-template", sourceFiles, templateFiles), [
    { file: sourceFiles[0], role: "source" },
    { file: templateFiles[0], role: "template-reference" },
  ]);
});
