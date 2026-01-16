import Spinner from "./Spinner";

interface ButtonLoaderProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export default function ButtonLoader({
  loading,
  children,
  loadingText,
}: ButtonLoaderProps) {
  if (loading) {
    return (
      <span className="flex items-center justify-center gap-2">
        <Spinner size="sm" className="text-current" />
        {loadingText && <span>{loadingText}</span>}
      </span>
    );
  }

  return <>{children}</>;
}
