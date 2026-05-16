import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, "../.env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

interface GroundTruthItem {
  id: string;
  image: string;
  expected: {
    title: string;
    category: string;
    priceRange: { min: number; max: number };
    tags: string[];
  };
}

interface AIResult {
  title: string;
  category: string;
  price: number;
  tags: string[];
}

interface EvalItem {
  id: string;
  image: string;
  expected: GroundTruthItem["expected"];
  actual: AIResult | null;
  scores: {
    categoryMatch: boolean;
    titleSimilarity: number;
    priceInRange: boolean;
    tagJaccard: number;
  };
}

interface EvalResults {
  timestamp: string;
  total: number;
  metrics: {
    categoryAccuracy: number;
    avgTitleSimilarity: number;
    priceInRangeRate: number;
    avgTagJaccard: number;
  };
  items: EvalItem[];
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a.map((t) => t.toLowerCase()));
  const setB = new Set(b.map((t) => t.toLowerCase()));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

function stringSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const bLower = b.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const aWords = new Set(aLower.split(/\s+/));
  const bWords = new Set(bLower.split(/\s+/));
  const intersection = new Set([...aWords].filter((w) => bWords.has(w)));
  const union = new Set([...aWords, ...bWords]);
  if (union.size === 0) return 1;
  return intersection.size / union.size;
  }

  async function callDigitize(imageUrl: string): Promise<AIResult | null> {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !anonKey) {
      console.warn("  [WARN] Supabase credentials not set in .env");
      return null;
    }

    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/digitize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ 
            imageUrl, 
            sellerId: "00000000-0000-4000-8000-000000000000" 
          }),

        }
      );

      if (!res.ok) {
        console.warn(`  [ERROR] HTTP ${res.status}: ${await res.text()}`);
        return null;
      }

      const data = await res.json();
      const product = data.product;
      return {
        title: product.title || "",
        category: product.category || "",
        price: product.price || 0,
        tags: product.tags || [],
      };
    } catch (err) {
      console.warn(`  [ERROR] ${err}`);
      return null;
    }
  }


async function main() {
  const groundTruthPath = resolve(__dirname, "../ai-eval/ground-truth.json");
  if (!existsSync(groundTruthPath)) {
    console.error("ground-truth.json not found. Run from project root or check path.");
    process.exit(1);
  }

  const groundTruth: GroundTruthItem[] = JSON.parse(
    readFileSync(groundTruthPath, "utf-8")
  );

  console.log(`\n AI Accuracy Evaluation`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Loaded ${groundTruth.length} test cases\n`);

  const items: EvalItem[] = [];
  let categoryCorrect = 0;
  let priceInRangeCount = 0;
  let titleSimilaritySum = 0;
  let tagJaccardSum = 0;
  let processedCount = 0;

  for (const item of groundTruth) {
    console.log(`[${item.id}] ${item.image}`);
    const actual = await callDigitize(item.image);

    if (actual) {
      const categoryMatch =
        actual.category.toLowerCase() === item.expected.category.toLowerCase();
      const titleSim = stringSimilarity(actual.title, item.expected.title);
      const priceInRange =
        actual.price >= item.expected.priceRange.min &&
        actual.price <= item.expected.priceRange.max;
      const tagJaccard = jaccardSimilarity(actual.tags, item.expected.tags);

      items.push({
        id: item.id,
        image: item.image,
        expected: item.expected,
        actual,
        scores: {
          categoryMatch,
          titleSimilarity: Math.round(titleSim * 100) / 100,
          priceInRange,
          tagJaccard: Math.round(tagJaccard * 100) / 100,
        },
      });

      if (categoryMatch) categoryCorrect++;
      if (priceInRange) priceInRangeCount++;
      titleSimilaritySum += titleSim;
      tagJaccardSum += tagJaccard;
      processedCount++;

      console.log(
        `  → Category: ${categoryMatch ? "✓" : "✗"} (got: ${actual.category}, expected: ${item.expected.category})`
      );
      console.log(
        `  → Title sim: ${(titleSim * 100).toFixed(0)}%  (got: "${actual.title}")`
      );
      console.log(
        `  → Price: ${priceInRange ? "✓" : "✗"} ₹${actual.price} [expected ₹${item.expected.priceRange.min}-${item.expected.priceRange.max}]`
      );
      console.log(`  → Tag Jaccard: ${(tagJaccard * 100).toFixed(0)}%`);
    } else {
      items.push({
        id: item.id,
        image: item.image,
        expected: item.expected,
        actual: null,
        scores: { categoryMatch: false, titleSimilarity: 0, priceInRange: false, tagJaccard: 0 },
      });
      console.log(`  → SKIPPED (no result)`);
    }
    console.log("");
  }

  const results: EvalResults = {
    timestamp: new Date().toISOString(),
    total: groundTruth.length,
    metrics: {
      categoryAccuracy:
        processedCount > 0 ? Math.round((categoryCorrect / processedCount) * 100) : 0,
      avgTitleSimilarity:
        processedCount > 0
          ? Math.round((titleSimilaritySum / processedCount) * 100) / 100
          : 0,
      priceInRangeRate:
        processedCount > 0
          ? Math.round((priceInRangeCount / processedCount) * 100)
          : 0,
      avgTagJaccard:
        processedCount > 0
          ? Math.round((tagJaccardSum / processedCount) * 100) / 100
          : 0,
    },
    items,
  };

  const outDir = resolve(__dirname, "../ai-eval");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "results.json");
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ai-eval/results.json\n`);
  console.log(`Summary:`);
  console.log(`  Category Accuracy:  ${results.metrics.categoryAccuracy}%`);
  console.log(`  Avg Title Similarity: ${(results.metrics.avgTitleSimilarity * 100).toFixed(0)}%`);
  console.log(`  Price In Range Rate: ${results.metrics.priceInRangeRate}%`);
  console.log(`  Avg Tag Jaccard:    ${(results.metrics.avgTagJaccard * 100).toFixed(0)}%`);
}

main().catch(console.error);
