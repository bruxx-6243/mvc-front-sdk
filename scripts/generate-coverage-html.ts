import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CoverageData {
  file: string;
  lines: { number: number; hits: number }[];
  functions: { name: string; hits: number }[];
  branches: { line: number; hits: number }[];
}

function parseLCOV(lcovContent: string): CoverageData[] {
  const files: CoverageData[] = [];
  const blocks = lcovContent.split("end_of_record\n");

  for (const block of blocks) {
    if (!block.trim()) continue;

    const lines: { number: number; hits: number }[] = [];
    const functions: { name: string; hits: number }[] = [];
    const branches: { line: number; hits: number }[] = [];
    let file = "";

    for (const line of block.split("\n")) {
      if (line.startsWith("SF:")) {
        file = line.substring(3).trim();
      } else if (line.startsWith("DA:")) {
        const [number, hits] = line.substring(3).split(",");
        lines.push({ number: parseInt(number), hits: parseInt(hits) });
      } else if (line.startsWith("FN:")) {
        const parts = line.substring(3).split(",");
        functions.push({ name: parts[1] || "", hits: 0 });
      } else if (line.startsWith("FNDA:")) {
        const [hits, name] = line.substring(5).split(",");
        const func = functions.find((f) => f.name === name);
        if (func) func.hits = parseInt(hits);
      }
    }

    if (file) {
      files.push({ file, lines, functions, branches });
    }
  }

  return files;
}

function calculateCoverage(data: CoverageData): {
  lines: { covered: number; total: number; percentage: number };
  functions: { covered: number; total: number; percentage: number };
} {
  const lines = {
    covered: data.lines.filter((l) => l.hits > 0).length,
    total: data.lines.length,
    percentage: 0,
  };
  lines.percentage =
    lines.total > 0 ? Math.round((lines.covered / lines.total) * 10000) / 100 : 100;

  const functions = {
    covered: data.functions.filter((f) => f.hits > 0).length,
    total: data.functions.length,
    percentage: 0,
  };
  functions.percentage =
    functions.total > 0
      ? Math.round((functions.covered / functions.total) * 10000) / 100
      : 100;

  return { lines, functions };
}

function generateHTML(files: CoverageData[]): string {
  const overall = files.reduce(
    (acc, file) => {
      const cov = calculateCoverage(file);
      acc.lines.covered += cov.lines.covered;
      acc.lines.total += cov.lines.total;
      acc.functions.covered += cov.functions.covered;
      acc.functions.total += cov.functions.total;
      return acc;
    },
    { lines: { covered: 0, total: 0 }, functions: { covered: 0, total: 0 } }
  );

  const overallLinesPct =
    overall.lines.total > 0
      ? Math.round((overall.lines.covered / overall.lines.total) * 10000) / 100
      : 100;
  const overallFuncsPct =
    overall.functions.total > 0
      ? Math.round((overall.functions.covered / overall.functions.total) * 10000) / 100
      : 100;

  const fileRows = files
    .map((file) => {
      const cov = calculateCoverage(file);
      const fileName = file.file.replace(/\\/g, "/");
      const lineColor =
        cov.lines.percentage >= 80
          ? "green"
          : cov.lines.percentage >= 50
            ? "orange"
            : "red";
      const funcColor =
        cov.functions.percentage >= 80
          ? "green"
          : cov.functions.percentage >= 50
            ? "orange"
            : "red";

      return `
      <tr>
        <td><a href="${fileName.replace(/\./g, "_")}.html">${fileName}</a></td>
        <td class="${funcColor}">${cov.functions.percentage.toFixed(2)}%</td>
        <td class="${lineColor}">${cov.lines.percentage.toFixed(2)}%</td>
        <td>${cov.lines.covered}/${cov.lines.total}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Coverage Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 30px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      padding: 20px;
      border-radius: 6px;
      background: #f8f9fa;
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }
    .green { color: #28a745; }
    .orange { color: #ffc107; }
    .red { color: #dc3545; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #dee2e6;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #dee2e6;
    }
    tr:hover {
      background: #f8f9fa;
    }
    a {
      color: #007bff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Code Coverage Report</h1>
    <div class="summary">
      <div class="summary-card">
        <h3>Functions</h3>
        <div class="value ${overallFuncsPct >= 80 ? 'green' : overallFuncsPct >= 50 ? 'orange' : 'red'}">${overallFuncsPct.toFixed(2)}%</div>
        <div style="font-size: 14px; color: #666; margin-top: 5px;">${overall.functions.covered}/${overall.functions.total}</div>
      </div>
      <div class="summary-card">
        <h3>Lines</h3>
        <div class="value ${overallLinesPct >= 80 ? 'green' : overallLinesPct >= 50 ? 'orange' : 'red'}">${overallLinesPct.toFixed(2)}%</div>
        <div style="font-size: 14px; color: #666; margin-top: 5px;">${overall.lines.covered}/${overall.lines.total}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>File</th>
          <th>Functions</th>
          <th>Lines</th>
          <th>Covered Lines</th>
        </tr>
      </thead>
      <tbody>
        ${fileRows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

function main() {
  const coverageDir = join(__dirname, "..", "coverage");
  const lcovFile = join(coverageDir, "lcov.info");
  const htmlDir = join(coverageDir, "html");

  try {
    const lcovContent = readFileSync(lcovFile, "utf-8");
    const files = parseLCOV(lcovContent);

    mkdirSync(htmlDir, { recursive: true });

    const html = generateHTML(files);
    const htmlFile = join(htmlDir, "index.html");
    writeFileSync(htmlFile, html);

    console.log(`✓ HTML coverage report generated at: ${htmlFile}`);
    console.log(`  Open in browser: file://${htmlFile.replace(/\\/g, "/")}`);
  } catch (error) {
    console.error("Error generating HTML report:", error);
    process.exit(1);
  }
}

main();

