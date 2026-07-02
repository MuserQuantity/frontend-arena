/** Technical Ledger — minimal ring spinner used in the modal loading state. */
export function RingSpinner() {
  return (
    <svg className="ring-spinner" viewBox="0 0 36 36" aria-label="Loading">
      <circle className="ring-bg" cx="18" cy="18" r="16" />
      <circle className="ring-fg" cx="18" cy="18" r="16" />
    </svg>
  );
}
