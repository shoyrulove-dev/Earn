"use client";
import React from "react";

const motion = new Proxy({}, { get: (_, tag: string) => React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ whileTap, initial, animate, layoutId, ...props }: any, ref) => React.createElement(tag, { ...props, ref })) }) as any;
export { motion };
