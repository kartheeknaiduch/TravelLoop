import { useState } from "react";
import {
  useListCities,
  useCreateStop,
  getGetTripQueryKey,
  getListCitiesQueryKey,
} from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Search, MapPin, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

export function AddStopDialog({
  tripId,
  nextOrder,
  tripStartDate,
  tripEndDate,
  existingStops,
}: {
  tripId: number;
  nextOrder: number;
  tripStartDate: string;
  tripEndDate: string;
  existingStops: Array<{ id: number; startDate: string; endDate: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const todayISO = new Date().toISOString().slice(0, 10);
  const minStartDate = tripStartDate > todayISO ? tripStartDate : todayISO;
  const endDateMin = startDate || minStartDate;
  const endDateMax = tripEndDate;
  const hasDateOverlap = (rangeStart: string, rangeEnd: string) =>
    existingStops.some(
      (stop) => rangeStart <= stop.endDate && rangeEnd >= stop.startDate,
    );
  const isDateBlocked = (date: Date) => {
    const iso = date.toISOString().slice(0, 10);
    return existingStops.some(
      (stop) => iso >= stop.startDate && iso <= stop.endDate,
    );
  };

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createStopMutation = useCreateStop();
  const cityParams = debouncedSearch ? { q: debouncedSearch } : undefined;

  const { data: cities, isLoading } = useListCities(cityParams, {
    query: { enabled: open, queryKey: getListCitiesQueryKey(cityParams) },
  });

  const handleAddStop = async () => {
    if (!selectedCityId || !startDate || !endDate) {
      toast({
        title: "Missing fields",
        description: "Please select a city and dates",
        variant: "destructive",
      });
      return;
    }

    if (startDate < minStartDate) {
      toast({
        title: "Invalid arrival date",
        description: "Arrival date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    if (startDate > tripEndDate) {
      toast({
        title: "Invalid arrival date",
        description: "Arrival must be within the trip dates",
        variant: "destructive",
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Invalid departure date",
        description: "Departure date must be on or after arrival",
        variant: "destructive",
      });
      return;
    }

    if (endDate > tripEndDate) {
      toast({
        title: "Invalid departure date",
        description: "Departure must be within the trip dates",
        variant: "destructive",
      });
      return;
    }

    if (hasDateOverlap(startDate, endDate)) {
      toast({
        title: "Overlapping dates",
        description: "This stop overlaps with another destination.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createStopMutation.mutateAsync({
        tripId,
        data: {
          cityId: selectedCityId,
          startDate,
          endDate,
          order: nextOrder,
        },
      });

      queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(tripId) });
      toast({ title: "Stop added successfully" });
      setOpen(false);

      // Reset form
      setSelectedCityId(null);
      setStartDate("");
      setEndDate("");
      setSearchTerm("");
    } catch (e: any) {
      toast({
        title: "Failed to add stop",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Plus className="w-4 h-4 mr-2" /> Add Destination
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Stop</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {!selectedCityId ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search cities..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                {isLoading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : cities && cities.length > 0 ? (
                  cities.map((city) => (
                    <div
                      key={city.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => setSelectedCityId(city.id)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{city.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {city.country}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Select
                      </Button>
                    </div>
                  ))
                ) : searchTerm ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No cities found
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Type to search for a city
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium">
                    {cities?.find((c) => c.id === selectedCityId)?.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCityId(null)}
                  className="h-8 text-xs"
                >
                  Change
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Arrival Date</Label>
                  <DatePicker
                    value={startDate}
                    min={minStartDate}
                    max={tripEndDate}
                    disabledDays={isDateBlocked}
                    onChange={setStartDate}
                    placeholder="Select arrival"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pick a date between {minStartDate} and {tripEndDate}.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Departure Date</Label>
                  <DatePicker
                    value={endDate}
                    min={endDateMin}
                    max={endDateMax}
                    disabledDays={isDateBlocked}
                    onChange={setEndDate}
                    placeholder="Select departure"
                  />
                  <p className="text-xs text-muted-foreground">
                    Departure must be on or after arrival, within trip dates.
                  </p>
                </div>
              </div>

              <Button
                className="w-full mt-4"
                onClick={handleAddStop}
                disabled={
                  !startDate || !endDate || createStopMutation.isPending
                }
              >
                {createStopMutation.isPending
                  ? "Adding..."
                  : "Add to Itinerary"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
