import urgencyModel from "@/lib/ml/urgencyModel.json";

type UrgencyLabel = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";

interface UrgencyModel {
  labels: UrgencyLabel[];
  vocab: Record<string, number>;
  classLogPrior: number[];
  featureLogProb: number[][];
}

export interface UrgencyPrediction {
  label: UrgencyLabel;
  confidence: number;
  probabilities: Record<UrgencyLabel, number>;
}

const model = urgencyModel as UrgencyModel;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function softmax(scores: number[]): number[] {
  const maxScore = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - maxScore));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / total);
}

export function predictUrgencyFromText(text: string): UrgencyPrediction {
  const tokens = tokenize(text);
  const tokenFreq = new Map<string, number>();

  tokens.forEach((token) => {
    tokenFreq.set(token, (tokenFreq.get(token) || 0) + 1);
  });

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

  const probs = softmax(scores);
  const probabilities = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    EMERGENCY: 0,
  } as Record<UrgencyLabel, number>;

  model.labels.forEach((label, idx) => {
    probabilities[label] = probs[idx];
  });

  const bestIndex = probs.reduce((best, curr, idx, arr) =>
    curr > arr[best] ? idx : best,
  0);

  return {
    label: model.labels[bestIndex],
    confidence: probs[bestIndex],
    probabilities,
  };
}

export function formatUrgencyHint(prediction: UrgencyPrediction): string {
  return `Local ML triage prediction: ${prediction.label} (confidence: ${(prediction.confidence * 100).toFixed(1)}%). Use this as supporting signal, not final diagnosis.`;
}
