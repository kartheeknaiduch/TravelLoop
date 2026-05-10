import { useState } from "react";
import {
  useListTrips,
  useAddStopActivity,
  useGetTrip,
  getListTripsQueryKey,
  getGetTripQueryKey,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export function AddToTripDialog({
  activityId,
  activityCost,
  cityId,
}: {
  activityId: number;
  activityCost: number;
  cityId: number;
}) {
  const [open, setOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedStopId, setSelectedStopId] = useState<string>("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // List user's trips to select from
  const { data: trips } = useListTrips(
    {},
    { query: { enabled: open, queryKey: getListTripsQueryKey({}) } },
  );
  const tripId = selectedTripId ? parseInt(selectedTripId, 10) : null;
  const { data: trip, isLoading: tripLoading } = useGetTrip(tripId ?? 0, {
    query: {
      enabled: !!tripId,
      queryKey: tripId ? getGetTripQueryKey(tripId) : undefined,
    },
  });

  const addActivityMutation = useAddStopActivity();

  const handleAdd = async () => {
    if (!selectedTripId || !selectedStopId) return;

    try {
      await addActivityMutation.mutateAsync({
        tripId: parseInt(selectedTripId),
        stopId: parseInt(selectedStopId),
        data: {
          activityId,
          cost: activityCost,
        },
      });

      queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
      if (tripId) {
        queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(tripId) });
      }
      toast({ title: "Activity added to your trip!" });
      setOpen(false);
    } catch (e: any) {
      toast({
        title: "Failed to add activity",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const availableStops = (trip?.stops ?? []).filter(
    (stop) => stop.cityId === cityId,
  );
  const stopDisabled =
    !selectedTripId || tripLoading || availableStops.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full h-7 px-2.5 text-xs font-semibold leading-none shrink-0"
        >
          <Plus className="w-4 h-4 mr-1" /> Add to Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Trip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select trip</label>
            <Select
              value={selectedTripId}
              onValueChange={(value) => {
                setSelectedTripId(value);
                setSelectedStopId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a trip" />
              </SelectTrigger>
              <SelectContent>
                {trips?.map((tripItem) => (
                  <SelectItem key={tripItem.id} value={tripItem.id.toString()}>
                    {tripItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select stop</label>
            <Select
              value={selectedStopId}
              onValueChange={setSelectedStopId}
              disabled={stopDisabled}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    tripLoading ? "Loading stops..." : "Choose a stop"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableStops.map((stop) => (
                  <SelectItem key={stop.id} value={stop.id.toString()}>
                    {stop.cityName} ({stop.startDate} - {stop.endDate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTripId && !tripLoading && availableStops.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No stops in this city yet. Add this city to your trip first.
              </p>
            )}
          </div>

          <Button
            onClick={handleAdd}
            className="w-full"
            disabled={
              !selectedTripId ||
              !selectedStopId ||
              addActivityMutation.isPending
            }
          >
            {addActivityMutation.isPending ? "Adding..." : "Add activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
