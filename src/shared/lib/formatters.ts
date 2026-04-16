export function formatCompactCount(value: number) {
  if (value < 1_000) {
    return String(value);
  }

  if (value < 1_000_000) {
    return formatAbbreviated(value / 1_000, 'K');
  }

  if (value < 1_000_000_000) {
    return formatAbbreviated(value / 1_000_000, 'M');
  }

  return formatAbbreviated(value / 1_000_000_000, 'B');
}

function formatAbbreviated(value: number, suffix: string) {
  const maximumFractionDigits = value >= 10 ? 0 : 1;
  const formatted = value
    .toFixed(maximumFractionDigits)
    .replace(/\.0$/, '');

  return `${formatted}${suffix}`;
}
