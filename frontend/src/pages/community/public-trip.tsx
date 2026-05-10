import { useLocation } from "wouter";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useGetPublicTrip, useCopyPublicTrip } from "@/api";
import { getGradientForString } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Copy, Map, Calendar, Users, Share2, Link2, MapPin, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function PublicTripView({ params }: { params: { shareCode: string } }) {
  useAuthRedirect();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: trip, isLoading } = useGetPublicTrip(params.shareCode, {
    query: { enabled: !!params.shareCode, queryKey: ["publicTrip", params.shareCode] }
  });
  
  const copyMutation = useCopyPublicTrip();

  const handleCopy = async () => {
    try {
      const newTrip = await copyMutation.mutateAsync({ shareCode: params.shareCode });
      toast({ title: "Trip copied!", description: "It's now in your trips." });
      setLocation(`/trips/${newTrip.id}`);
    } catch (error: any) {
      toast({ 
        title: "Failed to copy", 
        description: error.message || "Something went wrong", 
        variant: "destructive" 
      });
    }
  };

  const handleShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copied!", description: "Share URL has been copied to clipboard." });
    }).catch(() => {
      toast({ title: "Failed to copy link", variant: "destructive" });
    });
  };

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this trip: ${trip?.name || 'Amazing Itinerary'} on Traveloop!`);
    let shareUrl = "";
    
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }
    
    if (shareUrl) window.open(shareUrl, "_blank", "width=600,height=400");
  };

  if (isLoading) {
    return <div className="p-10"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!trip) {
    return <div className="p-10 text-center">Trip not found</div>;
  }

  const tripDetail = trip as any;
  const stops = tripDetail.stops || [];

  return (
    <div className="pb-20">
      <div 
        className="h-96 w-full relative bg-cover bg-center"
        style={{ 
          backgroundImage: trip.coverPhoto ? `url(${trip.coverPhoto})` : getGradientForString(trip.name)
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          {/* Share Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Share2 className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleShareLink}>
                <Link2 className="w-4 h-4 mr-2" /> Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareToSocial("twitter")}>
                <span className="w-4 h-4 mr-2 flex items-center justify-center text-xs font-bold">𝕏</span> Share on X
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareToSocial("facebook")}>
                <span className="w-4 h-4 mr-2 flex items-center justify-center text-xs font-bold">f</span> Share on Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareToSocial("whatsapp")}>
                <span className="w-4 h-4 mr-2 flex items-center justify-center text-xs font-bold">W</span> Share on WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareToSocial("linkedin")}>
                <span className="w-4 h-4 mr-2 flex items-center justify-center text-xs font-bold">in</span> Share on LinkedIn
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-2 text-white/80 mb-3 font-medium text-sm">
              <span className="bg-primary px-3 py-1 rounded-full text-white">Public Itinerary</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-white drop-shadow-md mb-2">
              {trip.name}
            </h1>
            <div className="flex items-center gap-4 text-white/90 font-medium flex-wrap">
              <span className="flex items-center"><Users className="w-4 h-4 mr-2"/> By {(trip as { authorName?: string }).authorName ?? "Traveloop traveler"}</span>
              <span>•</span>
              <span className="flex items-center"><Map className="w-4 h-4 mr-2"/> {trip.stopCount} stops</span>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="rounded-full shadow-xl bg-white text-secondary hover:bg-gray-100 px-8"
            onClick={handleCopy}
            disabled={copyMutation.isPending}
          >
            <Copy className="w-5 h-5 mr-2" />
            {copyMutation.isPending ? "Copying..." : "Copy to My Trips"}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="bg-card border rounded-2xl p-6 shadow-sm mb-8 flex flex-wrap gap-8 justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Dates</p>
            <p className="font-semibold text-lg">
              {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
            </p>
          </div>
          {trip.totalBudget && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
              <p className="font-semibold text-lg text-emerald-600">${trip.totalBudget.toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Stops</p>
            <p className="font-semibold text-lg">{trip.stopCount} destinations</p>
          </div>
        </div>

        {trip.description && (
          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <h3 className="font-serif text-2xl font-semibold mb-4">About this trip</h3>
            <p className="text-muted-foreground leading-relaxed">{trip.description}</p>
          </div>
        )}

        {/* Show stops if available */}
        {stops.length > 0 ? (
          <div className="space-y-6 mb-12">
            <h3 className="font-serif text-2xl font-semibold border-b pb-3">Itinerary</h3>
            <div className="space-y-4">
              {stops.map((stop: any, index: number) => (
                <div key={stop.id} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    {index < stops.length - 1 && <div className="w-0.5 h-full min-h-[60px] bg-border mt-2" />}
                  </div>
                  <div className="flex-1 bg-card border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-serif text-lg font-bold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" /> {stop.cityName}
                        <span className="text-sm font-normal text-muted-foreground">{stop.country}</span>
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(stop.startDate), 'MMM d')} - {format(new Date(stop.endDate), 'MMM d')}
                      </span>
                    </div>
                    {stop.activities && stop.activities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {stop.activities.map((act: any) => (
                          <div key={act.id} className="text-xs bg-muted/50 rounded-full px-3 py-1.5 flex items-center gap-2 font-medium">
                            <span>{act.name}</span>
                            <span className="text-emerald-600 flex items-center"><DollarSign className="w-3 h-3" />{act.cost}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 border border-dashed rounded-3xl p-12 text-center mb-8">
            <Map className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-2xl font-serif font-semibold mb-2">Want to see the full itinerary?</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Copy this trip to your account to view day-by-day details, interactive maps, and budget breakdowns.
            </p>
            <Button 
              size="lg" 
              className="rounded-full"
              onClick={handleCopy}
              disabled={copyMutation.isPending}
            >
              Copy Trip Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
