import Spinner from "./Spinner";

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message }: PageLoaderProps) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
      <Spinner size="lg" />
      {message && (
        <p className="mt-4 text-[var(--foreground-muted)] text-sm">{message}</p>
      )}
    </div>
  );
}
