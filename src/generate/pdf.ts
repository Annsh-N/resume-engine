import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type LatexCompiler = "tectonic" | "pdflatex" | "xelatex" | "latexmk";

type CompilePdfParams = {
  latex: string;
  jobName?: string;
  keepArtifacts?: boolean;
};

export type CompilePdfResult = {
  pdfBuffer: Buffer;
  pageCount: number;
  compiler: LatexCompiler;
  pdfPath?: string;
};

const MAX_BUFFER = 16 * 1024 * 1024;

const resolveCompiler = async (): Promise<LatexCompiler | null> => {
  for (const compiler of ["tectonic", "pdflatex", "xelatex", "latexmk"] as const) {
    try {
      await execFileAsync("sh", ["-lc", `command -v ${compiler}`], { maxBuffer: MAX_BUFFER });
      return compiler;
    } catch {
      continue;
    }
  }

  return null;
};

const getPdfPageCountFromBuffer = (pdfBuffer: Buffer, pdfPath: string): number => {
  const text = pdfBuffer.toString("latin1");
  const countMatches = [...text.matchAll(/\/Count\s+(\d+)/g)]
    .map((match) => Number.parseInt(match[1] ?? "0", 10))
    .filter((count) => Number.isFinite(count) && count > 0);

  if (countMatches.length > 0) {
    return Math.max(...countMatches);
  }

  const pageMatches = text.match(/\/Type\s*\/Page\b/g);
  if (pageMatches && pageMatches.length > 0) {
    return pageMatches.length;
  }

  throw new Error(`Unable to determine PDF page count for ${basename(pdfPath)}`);
};

const getPdfPageCount = async (pdfBuffer: Buffer, pdfPath: string): Promise<number> => {
  try {
    const { stdout } = await execFileAsync(
      "qpdf",
      ["--show-npages", pdfPath],
      { maxBuffer: MAX_BUFFER },
    );

    const pageCount = Number.parseInt(stdout.trim(), 10);
    if (Number.isFinite(pageCount) && pageCount > 0) {
      return pageCount;
    }
  } catch {
    // Fall back to a lightweight parser when qpdf is unavailable.
  }

  return getPdfPageCountFromBuffer(pdfBuffer, pdfPath);
};

const runCompiler = async (
  compiler: LatexCompiler,
  texPath: string,
  outDir: string,
): Promise<void> => {
  switch (compiler) {
    case "tectonic":
      await execFileAsync(
        "tectonic",
        ["--outdir", outDir, texPath],
        { cwd: outDir, maxBuffer: MAX_BUFFER },
      );
      return;
    case "pdflatex":
      await execFileAsync(
        "pdflatex",
        ["-interaction=nonstopmode", "-halt-on-error", `-output-directory=${outDir}`, texPath],
        { cwd: outDir, maxBuffer: MAX_BUFFER },
      );
      return;
    case "xelatex":
      await execFileAsync(
        "xelatex",
        ["-interaction=nonstopmode", "-halt-on-error", `-output-directory=${outDir}`, texPath],
        { cwd: outDir, maxBuffer: MAX_BUFFER },
      );
      return;
    case "latexmk":
      await execFileAsync(
        "latexmk",
        ["-pdf", "-interaction=nonstopmode", "-halt-on-error", `-outdir=${outDir}`, texPath],
        { cwd: outDir, maxBuffer: MAX_BUFFER },
      );
  }
};

export const compileLatexToPdf = async ({
  latex,
  jobName = "resume",
  keepArtifacts = false,
}: CompilePdfParams): Promise<CompilePdfResult> => {
  const compiler = await resolveCompiler();
  if (!compiler) {
    throw new Error(
      "No LaTeX compiler found. Install tectonic, pdflatex, xelatex, or latexmk to enable PDF validation.",
    );
  }

  const tempDir = await mkdtemp(join(tmpdir(), "resume-engine-"));
  const texPath = join(tempDir, `${jobName}.tex`);
  const expectedPdfPath = join(tempDir, `${jobName}.pdf`);

  try {
    await writeFile(texPath, latex, "utf8");
    await runCompiler(compiler, texPath, tempDir);

    const outputFiles = await readdir(tempDir);
    const resolvedPdfPath = outputFiles
      .filter((file) => file.endsWith(".pdf"))
      .map((file) => join(tempDir, file))[0] ?? expectedPdfPath;

    const pdfBuffer = await readFile(resolvedPdfPath);
    const pageCount = await getPdfPageCount(pdfBuffer, resolvedPdfPath);

    if (keepArtifacts) {
      return { pdfBuffer, pageCount, compiler, pdfPath: resolvedPdfPath };
    }

    return { pdfBuffer, pageCount, compiler };
  } finally {
    if (!keepArtifacts) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
};
