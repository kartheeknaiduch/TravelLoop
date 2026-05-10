import { useState } from "react";
import { useListActivities, useAddStopActivity, getGetTripQueryKey, getListActivitiesQueryKey } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, DollarSign, Clock } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

export function AddActivityDialog({ tripId, stopId, cityId }: { tripId: number, stopId: number, cityId: number }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const addActivityMutation = useAddStopActivity();
  const activityParams = { cityId, q: debouncedSearch ? debouncedSearch : undefined };

  const { data: activities, isLoading } = useListActivities(
    activityParams,
    { query: { enabled: open, queryKey: getListActivitiesQueryKey(activityParams) } }
  );

  const handleAddActivity = async (activityId: number, cost: number) => {
    try {
      await addActivityMutation.mutateAsync({
        tripId,
        stopId,
        data: {
          activityId,
          cost
        }
      });
      
      queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(tripId) });
      toast({ title: "Activity added" });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to add activity", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 text-primary hover:bg-primary/10 px-2 rounded-full">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search activities in this city..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
            {isLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">Searching...</div>
            ) : activities && activities.length > 0 ? (
              activities.map(activity => (
                <div key={activity.id} className="border rounded-lg p-3 hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-sm leading-tight">{activity.name}</h4>
                      <span className="text-xs text-muted-foreground inline-block mt-1 bg-muted px-1.5 py-0.5 rounded">{activity.type}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleAddActivity(activity.id, activity.cost)}
                      disabled={addActivityMutation.isPending}
                      className="h-7 text-xs px-2"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex gap-4 text-xs font-medium text-muted-foreground mt-2">
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/>{activity.duration}h</span>
                    <span className="flex items-center text-emerald-600"><DollarSign className="w-3 h-3"/>{activity.cost}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                No activities found matching your search.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
