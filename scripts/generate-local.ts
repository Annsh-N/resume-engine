import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const SAMPLE_JDS: Record<string, string> = {
  backend: `Backend Software Engineer

We are looking for a backend-focused software engineer to build APIs and internal platform services. You will work with TypeScript, Node.js, PostgreSQL, and AWS to improve reliability, observability, and developer workflows. Experience with schema design, distributed systems, metrics, and production debugging is preferred.`,
  infra: `Platform Engineer

We are hiring a platform engineer to improve deployment automation, cloud infrastructure, and service observability. The role uses AWS, Terraform, Kubernetes, Prometheus, and Grafana. Strong experience with reliability engineering, rollout safety, and production systems is preferred.`,
  ml: `Applied AI Engineer

Build Python services and retrieval workflows that support grounded LLM features. Experience with FastAPI, evaluation, prompt design, OpenAI APIs, and document retrieval is important. Candidates should be comfortable building backend systems, instrumentation, and data workflows for AI products.`,
  fullstack: `Full Stack Software Engineer

Join a product engineering team building customer-facing web applications with React, Next.js, TypeScript, Node.js, and PostgreSQL. We value strong frontend execution, backend API design, analytics instrumentation, and collaboration with product partners.`,
};

type ParsedArgs = {
  template: string;
  density: string;
  includePdf: boolean;
  outputPrefix: string;
  sample: string;
  jobDescription: string | null;
  jobDescriptionFile: string | null;
};

const parseArgs = (): ParsedArgs => {
  const args = process.argv.slice(2);
  const parsed: ParsedArgs = {
    template: "standard_swe",
    density: "normal",
    includePdf: true,
    outputPrefix: "out/generated-resume",
    sample: "backend",
    jobDescription: null,
    jobDescriptionFile: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--template" && next) {
      parsed.template = next;
      index += 1;
      continue;
    }

    if (arg === "--density" && next) {
      parsed.density = next;
      index += 1;
      continue;
    }

    if (arg === "--output-prefix" && next) {
      parsed.outputPrefix = next;
      index += 1;
      continue;
    }

    if (arg === "--sample" && next) {
      parsed.sample = next;
      index += 1;
      continue;
    }

    if (arg === "--jd" && next) {
      parsed.jobDescription = next;
      index += 1;
      continue;
    }

    if (arg === "--jd-file" && next) {
      parsed.jobDescriptionFile = next;
      index += 1;
      continue;
    }

    if (arg === "--no-pdf") {
      parsed.includePdf = false;
    }
  }

  return parsed;
};

const resolveJobDescription = async (args: ParsedArgs): Promise<string> => {
  if (args.jobDescription) {
    return args.jobDescription;
  }

  if (args.jobDescriptionFile) {
    return readFile(args.jobDescriptionFile, "utf8");
  }

  return SAMPLE_JDS[args.sample] ?? SAMPLE_JDS.backend;
};

const run = async () => {
  const args = parseArgs();
  const jobDescription = await resolveJobDescription(args);

  const response = await fetch("http://127.0.0.1:3000/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobDescription,
      template: args.template,
      density: args.density,
      includePdf: args.includePdf,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Generate request failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as {
    latex?: string;
    pdfBase64?: string;
    plan?: unknown;
    pageCount?: number;
    fitsOnOnePage?: boolean;
    compiler?: string;
  };

  if (!payload.latex) {
    throw new Error("Generate response did not include latex");
  }

  await mkdir(dirname(args.outputPrefix), { recursive: true });
  await writeFile(`${args.outputPrefix}.tex`, payload.latex, "utf8");
  await writeFile(
    `${args.outputPrefix}.plan.json`,
    JSON.stringify(
      {
        pageCount: payload.pageCount,
        fitsOnOnePage: payload.fitsOnOnePage,
        compiler: payload.compiler,
        plan: payload.plan,
      },
      null,
      2,
    ),
    "utf8",
  );

  if (args.includePdf && payload.pdfBase64) {
    await writeFile(`${args.outputPrefix}.pdf`, Buffer.from(payload.pdfBase64, "base64"));
  }

  console.log(`Wrote ${args.outputPrefix}.tex`);
  if (args.includePdf && payload.pdfBase64) {
    console.log(`Wrote ${args.outputPrefix}.pdf`);
  }
  console.log(`Wrote ${args.outputPrefix}.plan.json`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
