export function RainBackdrop() {
  return (
    <div className="rain-backdrop" aria-hidden="true">
      <span className="rain-haze" />
      <span className="rain-city" />
      <span className="rain-reflection" />
      <span className="rain-layer rain-far" />
      <span className="rain-layer rain-near" />
      <span className="rain-window" />
    </div>
  );
}
