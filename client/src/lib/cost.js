// Суммы стоимости запусков Claude в долларах

export function sumRunCosts(runs = []) {
  return runs.reduce((total, run) => total + (Number(run.costUsd) || 0), 0);
}

export function formatUsd(value) {
  return `$${value.toFixed(2)}`;
}
