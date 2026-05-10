import { useState } from "react";
import {
  TripDetail,
  useDeleteStop,
  useRemoveStopActivity,
  useUpdateStop,
  getGetTripQueryKey,
} from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Clock,
  DollarSign,
  Trash2,
  ArrowUp,
  ArrowDown,
  List,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  format,
  eachDayOfInterval,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { getGradientForString } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { AddStopDialog } from "./AddStopDialog";
import { AddActivityDialog } from "./AddActivityDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewMode = "timeline" | "calendar";

export function ItineraryTab({ trip }: { trip: TripDetail }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteStopMutation = useDeleteStop();
  const removeActivityMutation = useRemoveStopActivity();
  const updateStopMutation = useUpdateStop();
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [deleteStopId, setDeleteStopId] = useState<number | null>(null);

  const handleDeleteStop = async () => {
    if (deleteStopId === null) return;
    await deleteStopMutation.mutateAsync({
      tripId: trip.id,
      stopId: deleteStopId,
    });
    queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(trip.id) });
    toast({ title: "Stop removed" });
    setDeleteStopId(null);
  };

  const handleRemoveActivity = async (stopId: number, activityId: number) => {
    await removeActivityMutation.mutateAsync({
      tripId: trip.id,
      stopId,
      activityId,
    });
    queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(trip.id) });
    toast({ title: "Activity removed" });
  };

  const handleReorder = async (stopId: number, direction: "up" | "down") => {
    if (!trip.stops) return;
    const sorted = [...trip.stops].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === stopId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const currentOrder = sorted[idx].order;
    const swapOrder = sorted[swapIdx].order;

    try {
      await updateStopMutation.mutateAsync({
        tripId: trip.id,
        stopId: sorted[idx].id,
        data: { order: swapOrder },
      });
      await updateStopMutation.mutateAsync({
        tripId: trip.id,
        stopId: sorted[swapIdx].id,
        data: { order: currentOrder },
      });
      queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(trip.id) });
      toast({ title: "Order updated" });
    } catch {
      toast({ title: "Failed to reorder", variant: "destructive" });
    }
  };

  const nextOrder = trip.stops?.length
    ? Math.max(...trip.stops.map((s) => s.order)) + 1
    : 1;
  const sortedStops = trip.stops
    ? [...trip.stops].sort((a, b) => a.order - b.order)
    : [];

  // Calendar view data
  const buildCalendarData = () => {
    if (!trip.stops || trip.stops.length === 0) return [];
    try {
      const days = eachDayOfInterval({
        start: parseISO(trip.startDate),
        end: parseISO(trip.endDate),
      });
      return days.map((day) => {
        const dayStops = sortedStops.filter((stop) => {
          try {
            return isWithinInterval(day, {
              start: parseISO(stop.startDate),
              end: parseISO(stop.endDate),
            });
          } catch {
            return false;
          }
        });
        return { date: day, stops: dayStops };
      });
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-serif font-semibold text-secondary">
          The Journey
        </h2>
        <div className="flex items-center gap-3">
          <div className="bg-muted/50 rounded-lg p-1 flex">
            <Button
              variant={viewMode === "timeline" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs rounded-md"
              onClick={() => setViewMode("timeline")}
            >
              <List className="w-3.5 h-3.5 mr-1.5" /> Timeline
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs rounded-md"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> Calendar
            </Button>
          </div>
          <AddStopDialog
            tripId={trip.id}
            nextOrder={nextOrder}
            tripStartDate={trip.startDate}
            tripEndDate={trip.endDate}
            existingStops={trip.stops ?? []}
          />
        </div>
      </div>

      {!trip.stops || trip.stops.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 border border-dashed rounded-3xl">
          <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Where to?</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Your itinerary is empty. Start adding cities to build your route.
          </p>
        </div>
      ) : viewMode === "timeline" ? (
        /* Timeline View */
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[28px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          <AlertDialog
            open={deleteStopId !== null}
            onOpenChange={(open) => setDeleteStopId(open ? deleteStopId : null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this stop?</AlertDialogTitle>
                <AlertDialogDescription>
                  This destination and its activities will be removed from the
                  itinerary.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteStopId(null)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteStop}>
                  Remove stop
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {sortedStops.map((stop, index) => (
            <div
              key={stop.id}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
            >
              {/* Timeline dot */}
              <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-background bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <span className="font-serif font-bold text-lg">
                  {index + 1}
                </span>
              </div>

              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4">
                <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow group/card">
                  <div
                    className="h-32 w-full bg-cover bg-center relative"
                    style={{
                      backgroundImage: stop.imageUrl
                        ? `url(${stop.imageUrl})`
                        : getGradientForString(stop.cityName),
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                      <h3 className="text-2xl font-serif font-bold text-white drop-shadow-sm leading-none">
                        {stop.cityName}
                      </h3>
                      <span className="text-white/80 text-sm font-medium uppercase tracking-wider">
                        {stop.country}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4 bg-card">
                    <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-4">
                      <span>
                        {format(new Date(stop.startDate), "MMM d")} -{" "}
                        {format(new Date(stop.endDate), "MMM d")}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => handleReorder(stop.id, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => handleReorder(stop.id, "down")}
                          disabled={index === sortedStops.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteStopId(stop.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm font-medium uppercase tracking-wider text-secondary">
                        <span>Activities</span>
                        <AddActivityDialog
                          tripId={trip.id}
                          stopId={stop.id}
                          cityId={stop.cityId}
                        />
                      </div>

                      {!stop.activities || stop.activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          No activities planned yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {stop.activities.map((act) => (
                            <div
                              key={act.id}
                              className="flex justify-between items-center p-2 rounded-lg bg-muted/50 border border-border/30 hover:bg-muted transition-colors group/act"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {act.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {act.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex gap-3 text-xs font-medium text-muted-foreground">
                                  {act.time && (
                                    <span className="flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {act.time}
                                    </span>
                                  )}
                                  <span className="flex items-center text-emerald-600">
                                    <DollarSign className="w-3 h-3" />
                                    {act.cost}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground opacity-0 group-hover/act:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    handleRemoveActivity(
                                      stop.id,
                                      act.activityId,
                                    )
                                  }
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Calendar View */
        <div className="space-y-1">
          {buildCalendarData().map(({ date, stops: dayStops }) => {
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            return (
              <div
                key={date.toISOString()}
                className={`flex gap-4 p-3 rounded-xl border border-border/30 transition-colors ${
                  dayStops.length > 0
                    ? "bg-card hover:bg-muted/30"
                    : isWeekend
                      ? "bg-muted/20"
                      : "bg-transparent"
                }`}
              >
                <div className="w-20 shrink-0 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {format(date, "EEE")}
                  </div>
                  <div
                    className={`text-2xl font-bold ${dayStops.length > 0 ? "text-primary" : "text-muted-foreground/50"}`}
                  >
                    {format(date, "d")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(date, "MMM")}
                  </div>
                </div>
                <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[3rem]">
                  {dayStops.length === 0 ? (
                    <span className="text-sm text-muted-foreground/40 italic">
                      Free day
                    </span>
                  ) : (
                    dayStops.map((stop) => (
                      <div
                        key={stop.id}
                        className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm font-medium"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {stop.cityName}
                        {stop.activities && stop.activities.length > 0 && (
                          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold ml-1">
                            {stop.activities.length}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
