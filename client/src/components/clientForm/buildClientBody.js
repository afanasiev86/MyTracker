// Тело запроса из значений формы: пробелы убираем, сумму приводим к числу
export function buildClientBody(form) {
  return {
    name: form.name.trim(),
    company: form.company.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    notes: form.notes.trim(),
    rate: {
      kind: form.rateKind,
      amount: Number(form.rateAmount) || 0,
      currency: form.rateCurrency,
    },
  };
}
