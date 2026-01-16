import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, description, id, ...props }, ref) => {
    const checkboxId = id || props.name;

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={`w-4 h-4 rounded border-[var(--border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-2 ${className}`}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label htmlFor={checkboxId} className="text-sm font-medium text-[var(--foreground)] cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-[var(--foreground-muted)]">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
