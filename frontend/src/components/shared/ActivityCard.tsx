import { Link } from "wouter";
import { Activity } from "@/api";
import { getGradientForString } from "@/lib/image-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign } from "lucide-react";
import { AddToTripDialog } from "./AddToTripDialog";

export function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-border/50 flex flex-col h-full min-h-[420px]">
      <div 
        className="h-48 w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ 
          backgroundImage: activity.imageUrl ? `url(${activity.imageUrl})` : getGradientForString(activity.name)
        }}
      >
        <div className="absolute top-3 right-3">
          <Badge className="bg-background/90 text-foreground backdrop-blur-md hover:bg-background/90">{activity.type}</Badge>
        </div>
      </div>
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex items-center text-xs text-primary mb-2 font-medium">
          <MapPin className="w-3 h-3 mr-1" />
          {activity.cityName}
        </div>
        <h3 className="font-serif text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{activity.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {activity.description}
        </p>
        <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-border/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm font-medium text-secondary">
            <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-muted-foreground"/> {activity.duration}h</span>
            <span className="flex items-center text-emerald-600"><DollarSign className="w-4 h-4"/> {activity.cost}</span>
          </div>
          <div className="flex justify-end">
            <AddToTripDialog activityId={activity.id} activityCost={activity.cost} cityId={activity.cityId} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
