import { Link } from "wouter";
import { City } from "@/api";
import { getGradientForString } from "@/lib/image-utils";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, TrendingUp, DollarSign } from "lucide-react";
import { AddCityToTripDialog } from "./AddCityToTripDialog";

export function CityCard({ city }: { city: City }) {
  // 1-5 scale for cost
  const costLevel = Math.ceil(city.costIndex / 20);

  return (
    <Link href={`/cities/${city.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer border-0 group relative h-64">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage: city.imageUrl
              ? `url(${city.imageUrl})`
              : getGradientForString(city.name),
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute top-3 right-3 flex gap-2">
          <div className="bg-background/20 backdrop-blur-md rounded-full px-2 py-1 text-xs text-white font-medium flex items-center border border-white/20">
            <TrendingUp className="w-3 h-3 mr-1" />
            {city.popularity}%
          </div>
        </div>

        <CardContent className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-center gap-1.5 text-white/80 text-sm mb-1">
            <MapPin className="w-4 h-4" />
            <span className="font-medium tracking-wide uppercase">
              {city.country}
            </span>
          </div>
          <h3 className="font-serif text-2xl font-bold mb-2 text-white shadow-sm">
            {city.name}
          </h3>

          <div className="flex items-center gap-3">
            <div className="flex text-primary">
              {[...Array(5)].map((_, i) => (
                <DollarSign
                  key={i}
                  className={`w-4 h-4 ${i < costLevel ? "text-primary" : "text-white/30"}`}
                />
              ))}
            </div>
            <span className="text-sm text-white/70">{city.region}</span>
          </div>
          <div
            className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <AddCityToTripDialog cityId={city.id} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
