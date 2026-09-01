export function buildUploadQueue(templateId, sourceFiles, templateFiles) {
  const queue = Array.from(sourceFiles).map((file) => ({ file, role: "source" }));
  if (templateId !== "reference-template") return queue;
  return queue.concat(
    Array.from(templateFiles).map((file) => ({ file, role: "template-reference" })),
  );
}
