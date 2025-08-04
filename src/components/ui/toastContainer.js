import React from "react";
import { cn } from "./cn";

const ToastContainer = ({ toasts }) => {
    return (
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
            {toasts.map(({ id, title, description, variant }) => (
                <div
                    key={id}
                    className={cn(
                        "p-4 w-80 rounded-md shadow-md border transition-all",
                        variant === "destructive"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : variant === "success"
                                ? "bg-green-100 text-green-800 border-green-300"
                                : "bg-white text-gray-800 border-gray-200"
                    )}
                >
                    {title && <p className="font-semibold">{title}</p>}
                    {description && <p className="text-sm mt-1">{description}</p>}
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
