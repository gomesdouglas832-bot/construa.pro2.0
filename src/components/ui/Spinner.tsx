export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 border-ink-600 border-t-amber-400 animate-spin"
      style={{ width: size, height: size }}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950">
      <Spinner size={40} />
    </div>
  );
}
