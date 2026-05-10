import { useState } from "react";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useListCities } from "@/api";
import { CityCard } from "@/components/shared/CityCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Map as MapIcon, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const REGIONS = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania", "Middle East"];

export default function Cities() {
  useAuthRedirect();
  const [searchTerm, setSearchTerm] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const debouncedCountry = useDebounce(country, 300);
  
  const params: Record<string, string> = {};
  if (debouncedSearch) params.q = debouncedSearch;
  if (debouncedCountry) params.country = debouncedCountry;
  if (region) params.region = region;
  
  const { data: cities, isLoading } = useListCities(
    Object.keys(params).length > 0 ? params : undefined
  );

  const hasFilters = searchTerm || country || region;

  const clearFilters = () => {
    setSearchTerm("");
    setCountry("");
    setRegion("");
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-4">Explore Destinations</h1>
        <p className="text-xl text-muted-foreground">Find the perfect backdrop for your next adventure.</p>
        
        <div className="mt-8 relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            placeholder="Search for cities..." 
            className="pl-12 py-6 text-lg rounded-full shadow-sm border-primary/20 focus-visible:ring-primary/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="w-full sm:w-48">
            <Input
              placeholder="Filter by country..."
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4 mr-1" /> Clear filters
          </Button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
        </div>
      ) : !cities || cities.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 border border-dashed rounded-2xl">
          <MapIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No cities found</h3>
          <p className="text-muted-foreground mb-4">We couldn't find any destinations matching your filters.</p>
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{cities.length} destination{cities.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cities.map(city => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
