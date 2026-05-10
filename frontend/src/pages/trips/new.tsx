import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTrip } from "@/api";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { MapPin, Calendar, Globe, DollarSign } from "lucide-react";

const todayISO = new Date().toISOString().slice(0, 10);

const createTripSchema = z
  .object({
    name: z.string().min(3, "Trip name must be at least 3 characters"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    description: z.string().optional(),
    coverPhoto: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
    isPublic: z.boolean().default(false),
    totalBudget: z.coerce.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.startDate < todayISO) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Start date cannot be in the past",
      });
    }
    if (data.endDate && data.endDate < todayISO) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date cannot be in the past",
      });
    }
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be on or after start date",
      });
    }
  });

export default function NewTrip() {
  useAuthRedirect();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createTripMutation = useCreateTrip();
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof createTripSchema>>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      description: "",
      coverPhoto: "",
      isPublic: false,
      totalBudget: undefined,
    },
  });

  const startDateValue = form.watch("startDate");
  const endDateMin = startDateValue || todayISO;
  const coverPhotoValue = form.watch("coverPhoto");

  useEffect(() => {
    if (coverPhotoValue) {
      setCoverPreview(coverPhotoValue);
    } else {
      setCoverPreview(null);
    }
  }, [coverPhotoValue]);

  const handleCoverUpload = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      form.setValue("coverPhoto", result, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setCoverPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: z.infer<typeof createTripSchema>) => {
    try {
      const response = await createTripMutation.mutateAsync({
        data: {
          ...values,
          coverPhoto: values.coverPhoto || null,
          description: values.description || null,
          totalBudget: values.totalBudget || null,
        },
      });
      toast({
        title: "Trip created!",
        description: "Let's build your itinerary.",
      });
      setLocation(`/trips/${response.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to create trip",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-secondary">
          Plan a New Journey
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Define the broad strokes, you can add cities later.
        </p>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardContent className="p-6 md:p-10">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <div>
                <Label
                  htmlFor="name"
                  className="text-base font-semibold flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-primary" /> Trip Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer in Europe, Tokyo Explorer"
                  {...form.register("name")}
                  className="mt-2 text-lg py-6"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="startDate"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-primary" /> Start Date
                  </Label>
                  <div className="mt-2">
                    <DatePicker
                      value={startDateValue}
                      min={todayISO}
                      onChange={(value) =>
                        form.setValue("startDate", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      placeholder="Choose a start date"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Only today or future dates are available.
                  </p>
                  {form.formState.errors.startDate && (
                    <p className="mt-1 text-sm text-destructive">
                      {form.formState.errors.startDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="endDate"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-primary" /> End Date
                  </Label>
                  <div className="mt-2">
                    <DatePicker
                      value={form.watch("endDate")}
                      min={endDateMin}
                      onChange={(value) =>
                        form.setValue("endDate", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      placeholder="Choose an end date"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    End date must be on or after the start date.
                  </p>
                  {form.formState.errors.endDate && (
                    <p className="mt-1 text-sm text-destructive">
                      {form.formState.errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="description"
                  className="text-base font-semibold"
                >
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="What's the vibe of this trip?"
                  {...form.register("description")}
                  className="mt-2 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label
                    htmlFor="totalBudget"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4 text-primary" /> Total Budget
                    (Optional)
                  </Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    placeholder="e.g., 5000"
                    {...form.register("totalBudget")}
                    className="mt-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="coverPhoto"
                    className="text-base font-semibold"
                  >
                    Cover Photo (Optional)
                  </Label>
                  <div className="space-y-2">
                    <Input
                      id="coverPhoto"
                      placeholder="Paste an image URL or upload"
                      {...form.register("coverPhoto", {
                        onChange: (event) => {
                          const value = event.target.value as string;
                          setCoverPreview(value || null);
                        },
                      })}
                      className="mt-2"
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        handleCoverUpload(event.target.files?.[0] ?? null)
                      }
                      className="mt-2"
                    />
                    {coverPreview && (
                      <div className="mt-3 rounded-xl border border-border/50 overflow-hidden">
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    )}
                    {coverPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.setValue("coverPhoto", "", {
                            shouldDirty: true,
                          });
                          setCoverPreview(null);
                        }}
                      >
                        Remove cover
                      </Button>
                    )}
                  </div>
                  {form.formState.errors.coverPhoto && (
                    <p className="mt-1 text-sm text-destructive">
                      {form.formState.errors.coverPhoto.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                <div>
                  <Label
                    htmlFor="isPublic"
                    className="text-base font-semibold flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4 text-primary" /> Make Public
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow others to view and copy your itinerary. You can change
                    this later.
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={form.watch("isPublic")}
                  onCheckedChange={(checked) =>
                    form.setValue("isPublic", checked)
                  }
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/50 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/trips")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                className="rounded-full px-8"
                disabled={createTripMutation.isPending}
              >
                {createTripMutation.isPending ? "Creating..." : "Create Trip"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
