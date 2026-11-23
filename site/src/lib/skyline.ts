/** The Tehachapi ridge line with its wind turbines, drawn as an SVG string (used in the footer). */
export function skylineSvg() {
  const c = { back: "#2C221C", front: "#241B16", base: "#1B1411", tower: "#6F5E52" };
  const turbines: [number, number, number, number, number][] = [[168, 138, 0.9, 7.2, 10], [395, 103, 1, 6.1, 70], [553, 108, 0.78, 8, 35],
    [810, 98, 1.06, 6.6, 95], [1067, 92, 0.84, 7.5, 20], [1179, 80, 1, 5.8, 55], [1381, 97, 0.74, 8.4, 80]];
  const blade = "M0 0 C3.2 -10 3 -32 .6 -48 C-.9 -32 -2.4 -10 0 0 Z";
  const mills = turbines.map(([x, y, s, dur, a]) =>
    `<g transform="translate(${x} ${y}) scale(${(s * 0.8).toFixed(3)})" fill="${c.tower}"><path d="M-2.4 0 L2.4 0 L1.1 -82 L-1.1 -82 Z"/><rect x="-3" y="-85.5" width="9" height="5" rx="2"/>` +
    `<g transform="translate(0 -83) rotate(${a})"><g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="${dur}s" repeatCount="indefinite"/>` +
    [0, 120, 240].map((r) => `<path d="${blade}" transform="rotate(${r})"/>`).join("") + `</g><circle r="2.8"/></g></g>`).join("");
  return `<svg class="block h-auto min-h-[120px] w-full" viewBox="0 -30 1440 290" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">` +
    `<path fill="${c.back}" d="M0 170 C120 120 220 140 320 110 C420 80 520 120 640 95 C760 70 860 115 980 100 C1100 85 1200 60 1300 85 C1360 98 1410 90 1440 95 L1440 260 L0 260 Z"/>` +
    mills +
    `<path fill="${c.front}" d="M0 215 C140 180 260 200 380 185 C520 168 640 205 780 190 C920 175 1040 200 1180 182 C1300 168 1380 190 1440 185 L1440 260 L0 260 Z"/>` +
    `<rect x="0" y="232" width="1440" height="28" fill="${c.base}"/><rect x="0" y="231" width="1440" height="1.5" fill="rgba(246,239,227,.12)"/></svg>`;
}
