#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { generateTypeScriptForCollections } from "../src/cli/generateTypes.js";

async function main() {
  console.log("⚡ [appwrite-react-gen] Appwrite TypeScript Schema Generator\n");

  const endpoint = process.env.APPWRITE_ENDPOINT || process.argv.find((a) => a.startsWith("--endpoint="))?.split("=")[1];
  const project = process.env.APPWRITE_PROJECT_ID || process.argv.find((a) => a.startsWith("--project="))?.split("=")[1];
  const apiKey = process.env.APPWRITE_API_KEY || process.argv.find((a) => a.startsWith("--key="))?.split("=")[1];
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.argv.find((a) => a.startsWith("--db="))?.split("=")[1];
  const outputFilePath = process.argv.find((a) => a.startsWith("--out="))?.split("=")[1] || "src/types/appwrite.d.ts";

  if (!endpoint || !project || !apiKey || !databaseId) {
    console.error(`❌ Missing required parameters!
Usage:
  npx appwrite-react-gen --endpoint=https://cloud.appwrite.io/v1 --project=MY_PROJECT --key=SERVER_API_KEY --db=MY_DB --out=src/types/appwrite.d.ts

Or set environment variables:
  APPWRITE_ENDPOINT
  APPWRITE_PROJECT_ID
  APPWRITE_API_KEY
  APPWRITE_DATABASE_ID
`);
    process.exit(1);
  }

  console.log(`Connecting to Appwrite at ${endpoint}...`);
  console.log(`Project: ${project} | Database: ${databaseId}`);

  try {
    const res = await fetch(`${endpoint}/databases/${databaseId}/collections`, {
      headers: {
        "X-Appwrite-Project": project,
        "X-Appwrite-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch collections: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const collections = data.collections || [];

    console.log(`Found ${collections.length} collections. Generating TypeScript definitions...`);

    const tsCode = generateTypeScriptForCollections(databaseId, collections);

    const fullOutPath = path.resolve(process.cwd(), outputFilePath);
    const outDir = path.dirname(fullOutPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(fullOutPath, tsCode, "utf-8");
    console.log(`✅ Generated types successfully written to ${outputFilePath}\n`);
  } catch (err) {
    console.error(`❌ Error generating types:`, err.message);
    process.exit(1);
  }
}

main();
