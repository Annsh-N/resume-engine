import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const parseArgs = () => {
  const args = process.argv.slice(2);
  let template = "standard_swe";
  let density = "normal";
  let output = "out/resume.tex";
  let includeSections: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (!next) {
      continue;
    }

    if (arg === "--template") {
      template = next;
      index += 1;
      continue;
    }

    if (arg === "--density") {
      density = next;
      index += 1;
      continue;
    }

    if (arg === "--include") {
      includeSections = next
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (arg === "--output") {
      output = next;
      index += 1;
    }
  }

  return { template, density, includeSections, output };
};

const run = async () => {
  const { template, density, includeSections, output } = parseArgs();
  const response = await fetch("http://127.0.0.1:3000/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ template, density, includeSections }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Render request failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { latex?: string };
  if (!payload.latex) {
    throw new Error("Render response did not include latex field");
  }

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, payload.latex, "utf8");

  console.log(`Wrote LaTeX output to ${output}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
