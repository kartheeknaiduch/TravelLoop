import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetTrip,
  useUpdateTrip,
  useDeleteTrip,
  getListTripsQueryKey,
  getGetTripQueryKey,
} from "@/api";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useQueryClient } from "@tanstack/react-query";
import { getGradientForString } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Settings,
  Trash2,
  Map,
  Calendar,
  DollarSign,
  ListChecks,
  FileText,
} from "lucide-react";
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

// We'll create these subcomponents next
import { ItineraryTab } from "./components/ItineraryTab";
import { BudgetTab } from "./components/BudgetTab";
import { ChecklistTab } from "./components/ChecklistTab";
import { NotesTab } from "./components/NotesTab";

export default function TripDetail({ params }: { params: { tripId: string } }) {
  useAuthRedirect();
  const tripId = parseInt(params.tripId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("itinerary");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: trip, isLoading } = useGetTrip(tripId, {
    query: { enabled: !!tripId, queryKey: getGetTripQueryKey(tripId) },
  });

  const deleteMutation = useDeleteTrip();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ tripId });
      queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
      toast({ title: "Trip deleted" });
      setLocation("/trips");
    } catch (e) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading || !trip) {
    return (
      <div className="p-0">
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-muted/10">
      {/* Hero Header */}
      <div
        className="h-80 w-full relative bg-cover bg-center border-b"
        style={{
          backgroundImage: trip.coverPhoto
            ? `url(${trip.coverPhoto})`
            : getGradientForString(trip.name),
        }}
      >
        <div className="absolute inset-0 bg-black/50" />

        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/trips")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="bg-red-500/80 hover:bg-red-500 text-white border-0 backdrop-blur-md"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 text-white/80 mb-3 font-medium text-sm">
            <span
              className={`px-3 py-1 rounded-full text-white backdrop-blur-md font-semibold tracking-wide uppercase
              ${trip.status === "upcoming" ? "bg-primary/80" : ""}
              ${trip.status === "ongoing" ? "bg-emerald-500/80" : ""}
              ${trip.status === "completed" ? "bg-slate-500/80" : ""}
            `}
            >
              {trip.status}
            </span>
            {trip.isPublic && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-md">
                Public
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white drop-shadow-md mb-2">
            {trip.name}
          </h1>
          <p className="text-lg text-white/90 max-w-2xl line-clamp-2">
            {trip.description}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-8 -mt-8 relative z-10">
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone and will remove all stops, notes,
                and activities.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete trip
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-flex bg-background shadow-lg border border-border/50 p-1.5 rounded-2xl h-14">
            <TabsTrigger
              value="itinerary"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium px-6"
            >
              <Map className="w-4 h-4 mr-2 hidden md:inline-block" /> Itinerary
            </TabsTrigger>
            <TabsTrigger
              value="budget"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium px-6"
            >
              <DollarSign className="w-4 h-4 mr-2 hidden md:inline-block" />{" "}
              Budget
            </TabsTrigger>
            <TabsTrigger
              value="checklist"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium px-6"
            >
              <ListChecks className="w-4 h-4 mr-2 hidden md:inline-block" />{" "}
              Checklist
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium px-6"
            >
              <FileText className="w-4 h-4 mr-2 hidden md:inline-block" /> Notes
            </TabsTrigger>
          </TabsList>

          <div className="mt-8 bg-background border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <TabsContent
              value="itinerary"
              className="m-0 focus-visible:outline-none"
            >
              <ItineraryTab trip={trip} />
            </TabsContent>

            <TabsContent
              value="budget"
              className="m-0 focus-visible:outline-none"
            >
              <BudgetTab tripId={tripId} />
            </TabsContent>

            <TabsContent
              value="checklist"
              className="m-0 focus-visible:outline-none"
            >
              <ChecklistTab tripId={tripId} />
            </TabsContent>

            <TabsContent
              value="notes"
              className="m-0 focus-visible:outline-none"
            >
              <NotesTab tripId={tripId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
