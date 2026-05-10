import { useState } from "react";
import { Link, useLocation } from "wouter";
import { City, useGetCity } from "@/api";
import { getGradientForString } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowLeft, DollarSign } from "lucide-react";
import { ActivityCard } from "@/components/shared/ActivityCard";

export default function CityDetail({ params }: { params: { cityId: string } }) {
  const cityId = parseInt(params.cityId);
  const { data: city, isLoading } = useGetCity(cityId, {
    query: { enabled: !!cityId, queryKey: ["city", cityId] }
  });

  const costLevel = city ? Math.ceil(city.costIndex / 20) : 0;

  if (isLoading) {
    return (
      <div className="p-0">
        <Skeleton className="h-96 w-full rounded-none" />
        <div className="max-w-5xl mx-auto p-6 mt-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-6 w-full max-w-2xl" />
          <Skeleton className="h-6 w-full max-w-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!city) {
    return <div className="p-10 text-center">City not found</div>;
  }

  return (
    <div className="pb-20">
      <div 
        className="h-96 w-full relative bg-cover bg-center"
        style={{ 
          backgroundImage: city.imageUrl ? `url(${city.imageUrl})` : getGradientForString(city.name)
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <Link href="/cities">
          <Button variant="ghost" size="icon" className="absolute top-6 left-6 text-white hover:bg-white/20">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-white/80 mb-2 font-medium tracking-wider uppercase text-sm">
            <MapPin className="w-4 h-4" />
            <span>{city.region} • {city.country}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white drop-shadow-md">
            {city.name}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="flex flex-wrap gap-4 mb-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm font-medium">
            <span className="text-muted-foreground">Popularity</span>
            <span className="text-primary">{city.popularity}%</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm font-medium">
            <span className="text-muted-foreground">Cost Index</span>
            <div className="flex text-primary">
              {[...Array(5)].map((_, i) => (
                <DollarSign key={i} className={`w-4 h-4 ${i < costLevel ? 'text-primary' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
          </div>
        </div>

        {city.description && (
          <div className="prose prose-lg dark:prose-invert max-w-none mb-16 text-muted-foreground leading-relaxed">
            <p>{city.description}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-3xl font-serif font-bold text-secondary">Top Activities</h2>
          </div>
          
          {city.activities && city.activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {city.activities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed">
              <p className="text-muted-foreground">No activities found for this city.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
