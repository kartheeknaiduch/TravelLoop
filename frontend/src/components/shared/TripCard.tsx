import { Link } from "wouter";
import { format } from "date-fns";
import type { ReactNode } from "react";
import { Trip, useGetTripBudget, getGetTripBudgetQueryKey } from "@/api";
import { getGradientForString } from "@/lib/image-utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Map, Calendar, DollarSign } from "lucide-react";

export function TripCard({
  trip,
  actions,
}: {
  trip: Trip;
  actions?: ReactNode;
}) {
  const { data: budget } = useGetTripBudget(trip.id, {
    query: { enabled: !!trip.id, queryKey: getGetTripBudgetQueryKey(trip.id) },
  });
  const costValue = budget?.total ?? trip.totalBudget ?? null;
  const costText = costValue !== null ? costValue.toLocaleString() : "TBD";

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-border/50 group h-full flex flex-col">
        <div
          className="h-40 w-full relative bg-cover bg-center overflow-hidden"
          style={{
            backgroundImage: trip.coverPhoto
              ? `url(${trip.coverPhoto})`
              : getGradientForString(trip.name),
          }}
        >
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
          <div className="absolute top-3 right-3 flex gap-2">
            {trip.isPublic && (
              <Badge
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
              >
                Public
              </Badge>
            )}
            <Badge
              className={`
              ${trip.status === "upcoming" ? "bg-primary/90 text-primary-foreground" : ""}
              ${trip.status === "ongoing" ? "bg-emerald-500/90 text-white" : ""}
              ${trip.status === "completed" ? "bg-muted/90 text-muted-foreground" : ""}
              backdrop-blur-sm
            `}
            >
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-4 pb-2 flex-none">
          <h3 className="font-serif text-xl font-semibold line-clamp-1 group-hover:text-primary transition-colors">
            {trip.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
            {trip.description || "No description provided."}
          </p>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-grow">
          <div className="space-y-2 mt-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2 text-primary/70" />
              <span>
                {format(new Date(trip.startDate), "MMM d, yyyy")} -{" "}
                {format(new Date(trip.endDate), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Map className="w-4 h-4 mr-2 text-primary/70" />
              <span>
                {trip.stopCount} {trip.stopCount === 1 ? "stop" : "stops"}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 border-t border-border/40 bg-muted/20 flex justify-between items-center mt-auto">
          <div className="flex items-center text-sm font-medium">
            <DollarSign className="w-4 h-4 mr-1 text-primary" />
            {costText}
          </div>
          <div className="flex items-center gap-2">
            {actions && (
              <div
                className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                {actions}
              </div>
            )}
            <span className="text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
              View Trip <span className="ml-1">→</span>
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
