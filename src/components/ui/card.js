import { forwardRef } from "react";
import { cn } from "./cn";

export const Card = forwardRef((props, ref) => {
    const { className, ...rest } = props;

    return (
        <div
            ref={ref}
            className={cn("rounded-lg border bg-white text-card-foreground shadow-sm", className)}
            {...rest}
        />
    );
});

export const CardHeader = ({ className, ...props }) => (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
    <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
);

export const CardContent = ({ className, ...props }) => (
    <div className={cn("p-6 pt-0", className)} {...props} />
);

export const Badge = ({ className, ...props }) => (
    <div className={cn(className)} {...props} />
);
