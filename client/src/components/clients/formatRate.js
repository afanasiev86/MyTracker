// Ставка с единицей измерения: «2000 RUB в час» или «150000 RUB за проект»
export function formatRate(rate) {
  if (!rate) return 'Ставка не задана';
  const amount = `${rate.amount} ${rate.currency}`;
  return rate.kind === 'hourly' ? `${amount} в час` : `${amount} за проект`;
}
