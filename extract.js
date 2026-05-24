const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/Omar/.gemini/antigravity/brain/9c123b38-fe8c-4c38-9633-55e8e934d972/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('implement the following improvements')) {
      const parsed = JSON.parse(line);
      console.log(parsed.content);
      return;
    }
  }
}

processLineByLine();
