import { mkdir, writeFile } from "node:fs/promises";

const run = async () => {
  const response = await fetch("http://127.0.0.1:3000/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ density: "normal" }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Render request failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { latex?: string };
  if (!payload.latex) {
    throw new Error("Render response did not include latex field");
  }

  await mkdir("out", { recursive: true });
  await writeFile("out/resume.tex", payload.latex, "utf8");

  console.log("Wrote LaTeX output to out/resume.tex");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
