import fs from "node:fs";
import path from "node:path";

const LABELS = ["LOW", "MEDIUM", "HIGH", "EMERGENCY"];
const ALPHA = 1; // Laplace smoothing

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function softmax(scores) {
  const maxScore = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - maxScore));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / total);
}

function train() {
  const root = process.cwd();
  const dataPath = path.join(root, "src", "lib", "ml", "trainingData.json");
  const outputPath = path.join(root, "src", "lib", "ml", "urgencyModel.json");

  const dataset = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  if (!Array.isArray(dataset) || dataset.length === 0) {
    throw new Error("Training dataset is empty or invalid.");
  }

  const vocab = new Map();
  const classDocCount = new Array(LABELS.length).fill(0);
  const tokenCounts = LABELS.map(() => new Map());
  const classTokenTotals = new Array(LABELS.length).fill(0);

  for (const sample of dataset) {
    const classIndex = LABELS.indexOf(sample.label);
    if (classIndex === -1) {
      throw new Error(`Unknown label: ${sample.label}`);
    }

    classDocCount[classIndex] += 1;
    const tokens = tokenize(sample.text);

    for (const token of tokens) {
      if (!vocab.has(token)) {
        vocab.set(token, vocab.size);
      }

      const current = tokenCounts[classIndex].get(token) || 0;
      tokenCounts[classIndex].set(token, current + 1);
      classTokenTotals[classIndex] += 1;
    }
  }

  const vocabSize = vocab.size;
  const classLogPrior = classDocCount.map((c) => Math.log(c / dataset.length));
  const featureLogProb = LABELS.map((_, classIndex) => {
    const denom = classTokenTotals[classIndex] + ALPHA * vocabSize;
    const probs = new Array(vocabSize).fill(0);

    for (const [token, tokenIndex] of vocab.entries()) {
      const tokenCount = tokenCounts[classIndex].get(token) || 0;
      probs[tokenIndex] = Math.log((tokenCount + ALPHA) / denom);
    }

    return probs;
  });

  const model = {
    version: 1,
    createdAt: new Date().toISOString(),
    labels: LABELS,
    vocab: Object.fromEntries(vocab.entries()),
    classLogPrior,
    featureLogProb,
  };

  fs.writeFileSync(outputPath, JSON.stringify(model, null, 2), "utf-8");

  // Quick train-set estimate for demo readiness
  let correct = 0;
  for (const sample of dataset) {
    const prediction = predict(sample.text, model);
    if (prediction.label === sample.label) correct += 1;
  }
  const accuracy = ((correct / dataset.length) * 100).toFixed(2);
  console.log(`Model saved: ${outputPath}`);
  console.log(`Train-set accuracy: ${accuracy}% (${correct}/${dataset.length})`);
}

function predict(text, model) {
  const tokens = tokenize(text);
  const tokenFreq = new Map();
  for (const token of tokens) {
    tokenFreq.set(token, (tokenFreq.get(token) || 0) + 1);
  }

  const scores = model.labels.map((_, classIndex) => {
    let score = model.classLogPrior[classIndex];
    for (const [token, freq] of tokenFreq.entries()) {
      const tokenIndex = model.vocab[token];
      if (tokenIndex !== undefined) {
        score += freq * model.featureLogProb[classIndex][tokenIndex];
      }
    }
    return score;
  });

  const probabilities = softmax(scores);
  let maxIndex = 0;
  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[maxIndex]) maxIndex = i;
  }

  return { label: model.labels[maxIndex], confidence: probabilities[maxIndex] };
}

train();
