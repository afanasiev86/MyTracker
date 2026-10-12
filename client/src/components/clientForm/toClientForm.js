// Значения формы из клиента; без клиента — значения по умолчанию для нового
export function toClientForm(client) {
  return {
    name: client?.name || '',
    company: client?.company || '',
    email: client?.email || '',
    phone: client?.phone || '',
    notes: client?.notes || '',
    rateKind: client?.rate?.kind || 'hourly',
    rateAmount: client?.rate?.amount ?? 0,
    rateCurrency: client?.rate?.currency || 'RUB',
  };
}
