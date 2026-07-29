export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactNumber(amount: number): string {
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1) + ' M';
  }
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + ' Jt';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + ' Rb';
  }
  return amount.toString();
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
