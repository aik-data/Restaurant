/** $12, $1,520, or $4.50 when there are cents */
export function money(n: number) {
  const cents = Math.round(n * 100) % 100 !== 0;
  return "$" + (cents
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(n).toLocaleString("en-US"));
}

/** "Choose 1 pasta", "Choose 2 entrées" */
export function choiceTitle(c: { pick: number; label: string; plural: string }) {
  return "Choose " + c.pick + " " + (c.pick > 1 ? c.plural : c.label);
}
