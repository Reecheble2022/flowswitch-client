import React from "react";
import { cn } from "./cn";

export const Progress = ({ value, className, ...props }) => {
    return (
        <div className={cn("relative w-full h-2 bg-gray-200 rounded", className)} {...props}>
            <div
                className="absolute top-0 left-0 h-2 bg-blue-600 rounded"
                style={{ width: `${value}%` }}
            />
        </div>
    );
};
