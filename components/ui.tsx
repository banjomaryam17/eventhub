import Link from "next/link";

// Button
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  fullWidth?: boolean;
}

export function Button({
  children,
  onClick,
  href,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  className = "",
  fullWidth = false,
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:   "bg-indigo-600 hover:bg-indigo-500 text-white",
    secondary: "border border-slate-700 hover:border-slate-500 text-white hover:bg-slate-800",
    danger:    "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30",
    ghost:     "text-slate-400 hover:text-white hover:bg-slate-800",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-6 py-3",
  };

  const classes = `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`;

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}


//Card
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className = "", hover = false, padding = "md" }: CardProps) {
  const paddings = {
    none: "",
    sm:   "p-4",
    md:   "p-6",
    lg:   "p-8",
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl ${paddings[padding]} ${hover ? "hover:border-slate-600 hover:shadow-xl hover:shadow-black/30 transition-all duration-200" : ""} ${className}`}>
      {children}
    </div>
  );
}


// Badge
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-slate-700 text-slate-300",
    success: "bg-emerald-400/10 text-emerald-400",
    warning: "bg-amber-400/10 text-amber-400",
    danger:  "bg-red-400/10 text-red-400",
    info:    "bg-indigo-400/10 text-indigo-400",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}


// Condition Badge
export function ConditionBadge({ condition }: { condition: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "info" }> = {
    new:         { label: "New",         variant: "success" },
    used:        { label: "Used",        variant: "warning" },
    refurbished: { label: "Refurbished", variant: "info"    },
  };
  const { label, variant } = map[condition] ?? { label: condition, variant: "info" as const };
  return <Badge variant={variant}>{label}</Badge>;
}


// Status Badge (for orders) 
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
    pending:    { label: "Pending",    variant: "warning" },
    processing: { label: "Processing", variant: "info"   },
    paid:       { label: "Paid",       variant: "success" },
    shipped:    { label: "Shipped",    variant: "info"    },
    delivered:  { label: "Delivered",  variant: "success" },
    cancelled:  { label: "Cancelled",  variant: "danger"  },
    refunded:   { label: "Refunded",   variant: "danger"  },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={variant}>{label}</Badge>;
}


// Loading Spinner
export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}


// Empty State
interface EmptyStateProps {
  icon?: React.ReactNode; 
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-slate-400 text-sm max-w-sm mb-6">{description}</p>}
      {action && (
        <Button href={action.href}>{action.label}</Button>
      )}
    </div>
  );
}


// Star Rating
export function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="w-3.5 h-3.5" fill={i <= Math.round(rating) ? "#f59e0b" : "#334155"} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {count !== undefined && (
        <span className="text-xs text-slate-400 ml-1">({count})</span>
      )}
    </div>
  );
}


//Input
interface InputProps {
  label?: string;
  error?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  name?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <input
        {...props}
        className={`bg-slate-800/60 border ${error ? "border-red-500/50" : "border-slate-700"} rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}


//Select 
interface SelectProps {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  name?: string;
}

export function Select({ label, error, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <select
        {...props}
        className={`bg-slate-800/60 border ${error ? "border-red-500/50" : "border-slate-700"} rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all`}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}


// Textarea 
interface TextareaProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  name?: string;
}

export function Textarea({ label, error, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <textarea
        {...props}
        className={`bg-slate-800/60 border ${error ? "border-red-500/50" : "border-slate-700"} rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
