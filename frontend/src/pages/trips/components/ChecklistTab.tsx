import { useState } from "react";
import {
  useListChecklistItems,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  getListChecklistItemsQueryKey,
} from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  RotateCcw,
  Shirt,
  FileText,
  Smartphone,
  Package,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORIES = [
  { value: "general", label: "General", icon: Package },
  { value: "clothing", label: "Clothing", icon: Shirt },
  { value: "documents", label: "Documents", icon: FileText },
  { value: "electronics", label: "Electronics", icon: Smartphone },
];

export function ChecklistTab({ tripId }: { tripId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newItemName, setNewItemName] = useState("");
  const [category, setCategory] = useState("general");
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: items, isLoading } = useListChecklistItems(tripId, {
    query: {
      enabled: !!tripId,
      queryKey: getListChecklistItemsQueryKey(tripId),
    },
  });

  const createMutation = useCreateChecklistItem();
  const updateMutation = useUpdateChecklistItem();
  const deleteMutation = useDeleteChecklistItem();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    await createMutation.mutateAsync({
      tripId,
      data: { name: newItemName, category },
    });
    queryClient.invalidateQueries({
      queryKey: getListChecklistItemsQueryKey(tripId),
    });
    setNewItemName("");
  };

  const handleToggle = async (itemId: number, isPacked: boolean) => {
    await updateMutation.mutateAsync({
      tripId,
      itemId,
      data: { isPacked: !isPacked },
    });
    queryClient.invalidateQueries({
      queryKey: getListChecklistItemsQueryKey(tripId),
    });
  };

  const handleDelete = async (itemId: number) => {
    await deleteMutation.mutateAsync({ tripId, itemId });
    queryClient.invalidateQueries({
      queryKey: getListChecklistItemsQueryKey(tripId),
    });
  };

  const handleResetAll = async () => {
    if (!items) return;
    const packedItems = items.filter((i) => i.isPacked);
    for (const item of packedItems) {
      await updateMutation.mutateAsync({
        tripId,
        itemId: item.id,
        data: { isPacked: false },
      });
    }
    queryClient.invalidateQueries({
      queryKey: getListChecklistItemsQueryKey(tripId),
    });
    toast({
      title: "Checklist reset",
      description: `${packedItems.length} items unmarked.`,
    });
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const packedCount = items?.filter((i) => i.isPacked).length || 0;
  const totalCount = items?.length || 0;
  const progress =
    totalCount === 0 ? 0 : Math.round((packedCount / totalCount) * 100);

  const filteredItems =
    filterCategory === "all"
      ? items
      : items?.filter((i) => i.category === filterCategory);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-serif font-semibold text-secondary">
          Packing List
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium bg-muted px-4 py-1.5 rounded-full">
            {packedCount}/{totalCount} ({progress}%)
          </div>
          {packedCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset packing list?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark all {packedCount} packed items as unpacked.
                    Your items won't be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAll}>
                    Reset All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          variant={filterCategory === "all" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs rounded-full shrink-0"
          onClick={() => setFilterCategory("all")}
        >
          All ({totalCount})
        </Button>
        {CATEGORIES.map((cat) => {
          const count =
            items?.filter((i) => i.category === cat.value).length || 0;
          return (
            <Button
              key={cat.value}
              variant={filterCategory === cat.value ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs rounded-full shrink-0"
              onClick={() => setFilterCategory(cat.value)}
            >
              <cat.icon className="w-3.5 h-3.5 mr-1" /> {cat.label} ({count})
            </Button>
          );
        })}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[140px] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Add a new item..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={createMutation.isPending || !newItemName.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </form>

      <div className="space-y-4">
        {!filteredItems || filteredItems.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {filterCategory === "all"
              ? "No items in your checklist yet."
              : `No ${filterCategory} items yet.`}
          </div>
        ) : (
          <div className="divide-y divide-border/50 border rounded-xl overflow-hidden">
            {filteredItems.map((item) => {
              const catInfo = CATEGORIES.find((c) => c.value === item.category);
              const CatIcon = catInfo?.icon || Package;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={item.isPacked}
                      onCheckedChange={() =>
                        handleToggle(item.id, item.isPacked)
                      }
                      className="w-5 h-5 rounded border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor={`item-${item.id}`}
                      className={`text-base font-medium cursor-pointer transition-all ${item.isPacked ? "line-through text-muted-foreground" : "text-foreground"}`}
                    >
                      {item.name}
                    </label>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CatIcon className="w-3 h-3" /> {item.category}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
