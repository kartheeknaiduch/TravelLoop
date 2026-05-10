import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useGetDashboard } from "@/api";
import { TripCard } from "@/components/shared/TripCard";
import { CityCard } from "@/components/shared/CityCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Plus, Compass, Calendar, Map, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuthRedirect();
  const { data: dashboard, isLoading } = useGetDashboard();

  if (!user || isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64 mb-2" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-secondary tracking-tight">
            Welcome back, {user.firstName}.
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Where will your wanderlust take you next?
          </p>
        </div>
        <Link href="/trips/new">
          <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-shadow text-base px-6">
            <Plus className="w-5 h-5 mr-2" />
            Plan New Trip
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
            <div className="text-primary mb-3 bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold">{dashboard.upcomingTrips}</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Upcoming</div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
            <div className="text-emerald-500 mb-3 bg-emerald-500/10 w-10 h-10 rounded-full flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold">{dashboard.ongoingTrips}</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Ongoing</div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
            <div className="text-blue-500 mb-3 bg-blue-500/10 w-10 h-10 rounded-full flex items-center justify-center">
              <Map className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold">{dashboard.totalCitiesVisited}</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Cities Explored</div>
          </div>
          
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
            <div className="text-muted-foreground mb-3 bg-muted w-10 h-10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold">{dashboard.completedTrips}</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">Completed</div>
          </div>
        </div>
      )}

      {/* Recent Trips */}
      {dashboard?.recentTrips && dashboard.recentTrips.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-2xl font-serif font-semibold">Your Recent Trips</h2>
            <Link href="/trips" className="text-sm font-medium text-primary hover:underline">
              View all trips →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboard.recentTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state for trips */}
      {dashboard?.recentTrips && dashboard.recentTrips.length === 0 && (
        <section className="bg-muted/30 rounded-3xl p-10 border border-dashed border-border/50 text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Compass className="w-10 h-10 text-primary" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-serif font-semibold mb-2">Your canvas is blank</h3>
            <p className="text-muted-foreground">Every great journey begins with a single step. Start planning your first adventure.</p>
          </div>
          <Link href="/trips/new">
            <Button size="lg" className="rounded-full">Start Planning</Button>
          </Link>
        </section>
      )}

      {/* Recommended Cities */}
      {dashboard?.recommendedCities && dashboard.recommendedCities.length > 0 && (
        <section className="space-y-6 pb-10">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-2xl font-serif font-semibold">Inspiration for your next journey</h2>
            <Link href="/cities" className="text-sm font-medium text-primary hover:underline">
              Explore more →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboard.recommendedCities.map(city => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
