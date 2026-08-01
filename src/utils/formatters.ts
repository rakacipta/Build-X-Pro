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

export function formatFullDateIndonesian(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function terbilangRupiah(n: number): string {
  if (isNaN(n) || n === 0) return 'Nol Rupiah';
  const angka = Math.abs(Math.floor(n));
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function konversi(val: number): string {
    if (val < 12) return satuan[val];
    if (val < 20) return konversi(val - 10) + ' Belas';
    if (val < 100) return konversi(Math.floor(val / 10)) + ' Puluh ' + konversi(val % 10);
    if (val < 200) return 'Seratus ' + konversi(val - 100);
    if (val < 1000) return konversi(Math.floor(val / 100)) + ' Ratus ' + konversi(val % 100);
    if (val < 2000) return 'Seribu ' + konversi(val - 1000);
    if (val < 1000000) return konversi(Math.floor(val / 1000)) + ' Ribu ' + konversi(val % 1000);
    if (val < 1000000000) return konversi(Math.floor(val / 1000000)) + ' Juta ' + konversi(val % 1000000);
    if (val < 1000000000000) return konversi(Math.floor(val / 1000000000)) + ' Miliar ' + konversi(val % 1000000000);
    if (val < 1000000000000000) return konversi(Math.floor(val / 1000000000000)) + ' Triliun ' + konversi(val % 1000000000000);
    return val.toString();
  }

  const hasil = konversi(angka).replace(/\s+/g, ' ').trim();
  return `${hasil} Rupiah`;
}

