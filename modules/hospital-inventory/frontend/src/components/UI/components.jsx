import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function Card({ className, children }) {
    return (
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-200 p-6", className)}>
            {children}
        </div>
    );
}

export function Badge({ children, variant = "neutral", className }) {
    const variants = {
        neutral: "bg-slate-100 text-slate-700",
        success: "bg-emerald-100 text-emerald-700",
        warning: "bg-amber-100 text-amber-700",
        danger: "bg-rose-100 text-rose-700",
        brand: "bg-brand-100 text-brand-700",
    };

    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
            {children}
        </span>
    );
}
