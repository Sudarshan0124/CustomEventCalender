import { useToast } from "@/hooks/use-toast";

interface UseDragAndDropProps {
  onEventMove: (eventId: number, newDate: string) => void;
  setDragOverDate: (date: string | null) => void;
}

export function useDragAndDrop({ onEventMove, setDragOverDate }: UseDragAndDropProps) {
  const { toast } = useToast();

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData("text/plain", eventId);
    e.dataTransfer.effectAllowed = "move";
    
    // Add visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Remove visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = "";
    setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(date);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the calendar cell completely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverDate(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, newDate: string) => {
    e.preventDefault();
    setDragOverDate(null);
    
    const eventId = e.dataTransfer.getData("text/plain");
    
    if (eventId) {
      try {
        await onEventMove(parseInt(eventId), newDate);
        toast({
          title: "Success",
          description: "Event moved successfully!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to move event. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
