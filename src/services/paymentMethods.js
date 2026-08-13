const STORAGE_KEY = 'duruon-payment-methods';

export function getPaymentMethods() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function registerPaymentMethod(provider) {
  const methods = getPaymentMethods();
  const labels = {
    naver: '네이버페이',
    kakao: '카카오페이',
  };
  const existing = methods.find((method) => method.provider === provider);
  if (existing) return methods;

  const next = [
    ...methods,
    {
      id: `${provider}-${Date.now()}`,
      provider,
      label: labels[provider] || provider,
      registeredAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function removePaymentMethod(id) {
  const next = getPaymentMethods().filter((method) => method.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
