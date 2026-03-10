export function formatRupiah(value: number | null | undefined) {
  if (!value) return "0";

  return new Intl.NumberFormat("id-ID").format(value);
}