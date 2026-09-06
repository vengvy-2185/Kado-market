import { Search } from "lucide-react";

export function SearchBar({ defaultValue }: { defaultValue?: string }) {
  return (
    <form action="/" method="get" className="relative flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input
        type="text"
        name="q"
        placeholder="Search products, stores..."
        defaultValue={defaultValue}
        className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </form>
  );
}
