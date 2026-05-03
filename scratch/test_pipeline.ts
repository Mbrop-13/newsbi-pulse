import { runNewsPipeline } from "../src/lib/services/news-pipeline";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testPipeline() {
  console.log("Starting test pipeline...");
  console.log("GNEWS_API_KEY:", process.env.GNEWS_API_KEY ? "SET" : "NOT SET");
  
  try {
    const result = await runNewsPipeline();
    console.log("Pipeline result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Pipeline crashed:", error);
  }
}

testPipeline();
