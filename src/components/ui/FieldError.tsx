import { AlertCircle } from "lucide-react";

interface FieldErrorProps {
  message: string;
}

export function FieldError({ message }: FieldErrorProps) {
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {message}
    </p>
  );
}
