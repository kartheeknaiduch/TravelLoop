import { useState } from "react";
import {
  useCreateStop,
  useGetTrip,
  useListTrips,
  getGetTripQueryKey,
  getListTripsQueryKey,
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
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

type AddCityToTripDialogProps = {
  cityId: number;
};

export function AddCityToTripDialog({ cityId }: AddCityToTripDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createStopMutation = useCreateStop();

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

  const todayISO = new Date().toISOString().slice(0, 10);
  const minStartDate = trip?.startDate
    ? trip.startDate > todayISO
      ? trip.startDate
      : todayISO
    : todayISO;
  const endDateMin = startDate || minStartDate;
  const endDateMax = trip?.endDate;
  const existingStops = trip?.stops ?? [];
  const nextOrder = existingStops.length
    ? Math.max(...existingStops.map((stop) => stop.order)) + 1
    : 1;

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

  const resetForm = () => {
    setSelectedTripId("");
    setStartDate("");
    setEndDate("");
  };

  const handleAdd = async () => {
    if (!tripId || !startDate || !endDate) return;

    if (startDate < minStartDate) {
      toast({
        title: "Invalid arrival date",
        description: "Arrival date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    if (trip?.endDate && startDate > trip.endDate) {
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

    if (trip?.endDate && endDate > trip.endDate) {
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
        data: { cityId, startDate, endDate, order: nextOrder },
      });
      queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(tripId) });
      toast({ title: "Destination added" });
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Failed to add destination",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="rounded-full h-8 px-3">
          <Plus className="w-4 h-4 mr-1" /> Add to Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add City to Trip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select trip</label>
            <Select value={selectedTripId} onValueChange={setSelectedTripId}>
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

          {selectedTripId && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Arrival date</label>
                  <DatePicker
                    value={startDate}
                    min={minStartDate}
                    max={endDateMax}
                    disabledDays={isDateBlocked}
                    onChange={setStartDate}
                    placeholder="Select arrival"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departure date</label>
                  <DatePicker
                    value={endDate}
                    min={endDateMin}
                    max={endDateMax}
                    disabledDays={isDateBlocked}
                    onChange={setEndDate}
                    placeholder="Select departure"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {tripLoading
                  ? "Loading trip dates..."
                  : trip?.startDate
                    ? `Trip dates: ${trip.startDate} to ${trip.endDate}`
                    : "Pick dates within the trip timeline."}
              </p>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleAdd}
            disabled={
              !selectedTripId ||
              !startDate ||
              !endDate ||
              createStopMutation.isPending
            }
          >
            {createStopMutation.isPending ? "Adding..." : "Add destination"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
