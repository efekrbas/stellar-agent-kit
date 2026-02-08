const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const repo = { type: "git", url: "https://github.com/codewmilan/stellar-agent-kit.git" };
const publishConfig = { access: "public" };

const packages = [
  "packages/x402-stellar-sdk/package.json",
  "packages/create-stellar-devkit-app/package.json",
  "packages/stellar-devkit-mcp/package.json",
];

for (const p of packages) {
  const fullPath = path.join(root, p);
  const j = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  j.scripts = j.scripts || {};
  j.scripts.prepublishOnly = "npm run build";
  j.repository = repo;
  j.license = "MIT";
  j.publishConfig = publishConfig;
  j.engines = j.engines || { node: ">=18" };
  if (p.includes("stellar-devkit-mcp")) {
    j.files = ["dist"];
    j.types = "./dist/index.d.ts";
  }
  fs.writeFileSync(fullPath, JSON.stringify(j, null, 2));
  console.log("Updated", p);
}
