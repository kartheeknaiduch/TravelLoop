import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useListTrips, useDeleteTrip, getListTripsQueryKey } from "@/api";
import { TripCard } from "@/components/shared/TripCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Map } from "lucide-react";
import { ListTripsStatus } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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

export default function Trips() {
  useAuthRedirect();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [deleteTripId, setDeleteTripId] = useState<number | null>(null);

  const statusFilter =
    activeTab === "all" ? undefined : (activeTab as ListTripsStatus);
  const { data: trips, isLoading } = useListTrips({ status: statusFilter });
  const deleteMutation = useDeleteTrip();

  const handleDeleteTrip = async () => {
    if (deleteTripId === null) return;
    try {
      await deleteMutation.mutateAsync({ tripId: deleteTripId });
      queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
      toast({ title: "Trip deleted" });
    } catch (error: any) {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteTripId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <AlertDialog
        open={deleteTripId !== null}
        onOpenChange={(open) => setDeleteTripId(open ? deleteTripId : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will remove all stops and notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTripId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrip}>
              Delete trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-secondary">
            My Trips
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your journeys.
          </p>
        </div>
        <Link href="/trips/new">
          <Button className="rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Create Trip
          </Button>
        </Link>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">
            All
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="rounded-lg">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="rounded-lg">
            Ongoing
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg">
            Completed
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-xl" />
              ))}
            </div>
          ) : !trips || trips.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 border border-dashed rounded-2xl">
              <Map className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No trips found</h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === "all"
                  ? "You haven't planned any trips yet."
                  : `You have no ${activeTab} trips.`}
              </p>
              {activeTab !== "all" && (
                <Button variant="outline" onClick={() => setActiveTab("all")}>
                  View all trips
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  actions={
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setLocation(`/trips/${trip.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteTripId(trip.id)}
                      >
                        Delete
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
