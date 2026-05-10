import { useState } from "react";
import {
  useListTripNotes,
  useCreateTripNote,
  useUpdateTripNote,
  useDeleteTripNote,
  getListTripNotesQueryKey,
  useGetTrip,
  getGetTripQueryKey,
} from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Send, Trash2, Edit3, X, Check, MapPin } from "lucide-react";
import { format } from "date-fns";

export function NotesTab({ tripId }: { tripId: number }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [selectedStopId, setSelectedStopId] = useState<string>("none");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data: notes, isLoading } = useListTripNotes(tripId, {
    query: { enabled: !!tripId, queryKey: getListTripNotesQueryKey(tripId) },
  });

  const { data: trip } = useGetTrip(tripId, {
    query: { enabled: !!tripId, queryKey: getGetTripQueryKey(tripId) },
  });

  const createMutation = useCreateTripNote();
  const updateMutation = useUpdateTripNote();
  const deleteMutation = useDeleteTripNote();

  const handleAdd = async () => {
    if (!content.trim()) return;
    const data: { content: string; stopId?: number | null } = { content };
    if (selectedStopId !== "none") {
      data.stopId = parseInt(selectedStopId);
    }
    await createMutation.mutateAsync({ tripId, data });
    queryClient.invalidateQueries({
      queryKey: getListTripNotesQueryKey(tripId),
    });
    setContent("");
    setSelectedStopId("none");
  };

  const handleDelete = async (noteId: number) => {
    await deleteMutation.mutateAsync({ tripId, noteId });
    queryClient.invalidateQueries({
      queryKey: getListTripNotesQueryKey(tripId),
    });
  };

  const startEdit = (noteId: number, currentContent: string) => {
    setEditingNoteId(noteId);
    setEditContent(currentContent);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditContent("");
  };

  const saveEdit = async (noteId: number) => {
    if (!editContent.trim()) return;
    await updateMutation.mutateAsync({
      tripId,
      noteId,
      data: { content: editContent },
    });
    queryClient.invalidateQueries({
      queryKey: getListTripNotesQueryKey(tripId),
    });
    setEditingNoteId(null);
    setEditContent("");
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const stops = trip?.stops || [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto flex flex-col h-[600px]">
      <div className="flex items-center justify-between border-b pb-4 shrink-0">
        <h2 className="text-2xl font-serif font-semibold text-secondary">
          Travel Journal
        </h2>
        <span className="text-sm text-muted-foreground">
          {notes?.length || 0} notes
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {!notes || notes.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground italic h-full flex items-center justify-center flex-col gap-4">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
              <Edit3 className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p>
              Your journal is empty. Write down ideas, confirmations, or
              memories.
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm relative group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {format(new Date(note.createdAt), "MMM d, yyyy • h:mm a")}
                  </span>
                  {note.stopName && (
                    <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {note.stopName}
                    </span>
                  )}
                  {note.updatedAt && note.updatedAt !== note.createdAt && (
                    <span className="text-xs text-muted-foreground/60 italic">
                      edited
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingNoteId !== note.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => startEdit(note.id, note.content)}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {editingNoteId === note.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[80px] focus-visible:ring-primary"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                      className="h-8"
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveEdit(note.id)}
                      disabled={updateMutation.isPending || !editContent.trim()}
                      className="h-8"
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 mt-4 bg-card border rounded-2xl p-3 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all space-y-3">
        {stops.length > 0 && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground shrink-0">
              Link to stop:
            </Label>
            <Select value={selectedStopId} onValueChange={setSelectedStopId}>
              <SelectTrigger className="h-8 text-xs w-48">
                <SelectValue placeholder="General note" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General (no stop)</SelectItem>
                {stops.map((stop) => (
                  <SelectItem key={stop.id} value={stop.id.toString()}>
                    {stop.cityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Textarea
          placeholder="Jot down a thought..."
          className="border-0 focus-visible:ring-0 resize-none min-h-[80px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end p-1">
          <Button
            size="sm"
            className="rounded-full px-4"
            onClick={handleAdd}
            disabled={createMutation.isPending || !content.trim()}
          >
            <Send className="w-4 h-4 mr-2" /> Post
          </Button>
        </div>
      </div>
    </div>
  );
}
