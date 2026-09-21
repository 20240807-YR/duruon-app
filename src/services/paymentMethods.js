const STORAGE_KEY = 'duruon-payment-methods';

function scopedKey(userId) {
  return `${STORAGE_KEY}:${userId || 'guest'}`;
}

function readMethods(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    try { localStorage.removeItem(key); } catch { /* storage is unavailable */ }
    return null;
  }
}

function writeMethods(key, methods) {
  try { localStorage.setItem(key, JSON.stringify(methods)); } catch { /* storage is unavailable */ }
  return methods;
}

export function getPaymentMethods(userId) {
  const key = scopedKey(userId);
  const scoped = readMethods(key);
  if (scoped !== null) return scoped;

  // Migrate the old global list once, so existing demo data is not lost.
  if (userId) {
    const legacy = readMethods(STORAGE_KEY);
    if (legacy !== null) {
      writeMethods(key, legacy);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage is unavailable */ }
      return legacy;
    }
  }
  return [];
}

export function registerPaymentMethod(provider, userId) {
  const key = scopedKey(userId);
  const methods = getPaymentMethods(userId);
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
  return writeMethods(key, next);
}

export function removePaymentMethod(id, userId) {
  const key = scopedKey(userId);
  const next = getPaymentMethods(userId).filter((method) => method.id !== id);
  return writeMethods(key, next);
}
