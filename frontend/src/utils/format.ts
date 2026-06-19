/**
 * Formatea un número como moneda colombiana: 85000 → "$85.000"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(isoString: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(isoString: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
