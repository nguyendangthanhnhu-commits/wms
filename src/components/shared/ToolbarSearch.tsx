"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

type ToolbarSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function ToolbarSearch({ value, onChange, placeholder = "Tìm kiếm...", className }: ToolbarSearchProps) {
  return (
    <div className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-8"
        />
      </div>
    </div>
  );
}

