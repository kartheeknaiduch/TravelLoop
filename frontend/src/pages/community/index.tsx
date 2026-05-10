import { Link } from "wouter";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useListPublicTrips } from "@/api";
import { getGradientForString } from "@/lib/image-utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Calendar, DollarSign, Users, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Community() {
  useAuthRedirect();
  const { data: trips, isLoading } = useListPublicTrips();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-4">Traveloop Community</h1>
        <p className="text-xl text-muted-foreground">Get inspired by itineraries crafted by fellow travelers. Copy them to your own plans.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
        </div>
      ) : !trips || trips.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 border border-dashed rounded-2xl">
          <Map className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No public trips yet</h3>
          <p className="text-muted-foreground">Be the first to share your itinerary with the community!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trips.map(trip => (
            <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group flex flex-col h-full">
              <div 
                className="h-48 w-full relative bg-cover bg-center"
                style={{ 
                  backgroundImage: trip.coverPhoto ? `url(${trip.coverPhoto})` : getGradientForString(trip.name)
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-medium bg-white/20 backdrop-blur-md rounded-full px-2 py-1 w-fit mb-2 border border-white/30">
                    By {trip.authorName}
                  </div>
                </div>
              </div>
              
              <CardHeader className="p-5 pb-2">
                <h3 className="font-serif text-xl font-bold line-clamp-1">{trip.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2 h-10">
                  {trip.description || "A beautifully crafted journey."}
                </p>
              </CardHeader>
              
              <CardContent className="p-5 pt-2 flex-grow">
                <div className="space-y-3 mt-2">
                  <div className="flex items-center text-sm font-medium text-secondary">
                    <Calendar className="w-4 h-4 mr-3 text-primary/70" />
                    <span>{format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm font-medium text-secondary">
                    <Map className="w-4 h-4 mr-3 text-primary/70" />
                    <span>{trip.stopCount} {trip.stopCount === 1 ? 'stop' : 'stops'}</span>
                  </div>
                  {trip.totalBudget && (
                    <div className="flex items-center text-sm font-medium text-secondary">
                      <DollarSign className="w-4 h-4 mr-3 text-primary/70" />
                      <span>${trip.totalBudget.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="p-5 pt-0 border-t border-border/40 bg-muted/10 mt-auto">
                <Link href={`/community/${trip.shareCode}`} className="w-full">
                  <Button className="w-full mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                    View Itinerary
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
