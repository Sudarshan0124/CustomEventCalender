import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import type { Event, InsertEvent, UpdateEvent } from "@shared/schema";

export function useEvents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all events
  const { 
    data: events, 
    isLoading, 
    error 
  } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: InsertEvent) => {
      const response = await apiRequest("POST", "/api/events", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...data }: UpdateEvent & { id: number }) => {
      const response = await apiRequest("PUT", `/api/events/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate recurring events
  const generateRecurringEvents = (event: InsertEvent): InsertEvent[] => {
    const recurringEvents: InsertEvent[] = [];
    
    if (event.recurrence === "none") {
      return [event];
    }

    const baseDate = new Date(event.date);
    const endDate = addMonths(baseDate, 12); // Generate events for next 12 months
    
    let currentDate = baseDate;
    
    while (currentDate <= endDate) {
      if (currentDate > baseDate) {
        recurringEvents.push({
          ...event,
          date: format(currentDate, "yyyy-MM-dd"),
          originalEventId: event.originalEventId || undefined,
        });
      }
      
      switch (event.recurrence) {
        case "daily":
          currentDate = addDays(currentDate, 1);
          break;
        case "weekly":
          currentDate = addWeeks(currentDate, 1);
          break;
        case "monthly":
          currentDate = addMonths(currentDate, 1);
          break;
        case "custom":
          if (event.recurrenceConfig) {
            try {
              const config = JSON.parse(event.recurrenceConfig);
              const interval = config.interval || 1;
              
              switch (config.period) {
                case "days":
                  currentDate = addDays(currentDate, interval);
                  break;
                case "weeks":
                  currentDate = addWeeks(currentDate, interval);
                  break;
                case "months":
                  currentDate = addMonths(currentDate, interval);
                  break;
                default:
                  currentDate = addDays(currentDate, interval);
              }
            } catch (e) {
              currentDate = addDays(currentDate, 1);
            }
          } else {
            currentDate = addDays(currentDate, 1);
          }
          break;
        default:
          currentDate = endDate; // Break the loop
      }
    }
    
    return [event, ...recurringEvents];
  };

  // Check for event conflicts
  const checkConflicts = async (eventData: InsertEvent, excludeId?: number): Promise<Event[]> => {
    if (!events) return [];
    
    return events.filter(event => {
      if (excludeId && event.id === excludeId) return false;
      return event.date === eventData.date && event.time === eventData.time;
    });
  };

  // Create event with recurring support
  const createEvent = async (eventData: InsertEvent) => {
    const eventsToCreate = generateRecurringEvents(eventData);
    
    for (const event of eventsToCreate) {
      await createEventMutation.mutateAsync(event);
    }
  };

  // Update event
  const updateEvent = async (data: UpdateEvent & { id: number }) => {
    await updateEventMutation.mutateAsync(data);
  };

  // Delete event
  const deleteEvent = async (id: number) => {
    await deleteEventMutation.mutateAsync(id);
  };

  return {
    events: events || [],
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    checkConflicts,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
  };
}
