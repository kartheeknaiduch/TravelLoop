import { useState } from "react";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useListActivities } from "@/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Compass, X, Filter } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { ActivityCard } from "@/components/shared/ActivityCard";

const ACTIVITY_TYPES = ["sightseeing", "adventure", "food", "culture", "nature", "nightlife", "shopping", "wellness"];
const COST_RANGES = [
  { label: "Any price", value: "" },
  { label: "Under $25", value: "25" },
  { label: "Under $50", value: "50" },
  { label: "Under $100", value: "100" },
  { label: "Under $200", value: "200" },
];

export default function Activities() {
  useAuthRedirect();
  const [searchTerm, setSearchTerm] = useState("");
  const [type, setType] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const params: Record<string, any> = {};
  if (debouncedSearch) params.q = debouncedSearch;
  if (type) params.type = type;
  if (maxCost) params.maxCost = parseFloat(maxCost);

  const { data: activities, isLoading } = useListActivities(
    Object.keys(params).length > 0 ? params : undefined
  );

  const hasFilters = searchTerm || type || maxCost;

  const clearFilters = () => {
    setSearchTerm("");
    setType("");
    setMaxCost("");
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-4">Discover Activities</h1>
          <p className="text-xl text-muted-foreground">Find unforgettable experiences around the globe.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search activities..." 
            className="pl-10 rounded-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-2 shrink-0">
          <Filter className="w-4 h-4" /> Filters
        </div>
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="w-full sm:w-48">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Activity type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select value={maxCost} onValueChange={setMaxCost}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Max cost" />
              </SelectTrigger>
              <SelectContent>
                {COST_RANGES.map(r => (
                  <SelectItem key={r.value || "any"} value={r.value || "any"}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 border border-dashed rounded-2xl">
          <Compass className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No activities found</h3>
          <p className="text-muted-foreground mb-4">We couldn't find any activities matching your filters.</p>
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {activities.map(activity => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
