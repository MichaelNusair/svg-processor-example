export function LoadingSpinner({ size = 20 }: { size?: number }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}

export function LoadingPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <LoadingSpinner size={40} />
    </div>
  );
}
