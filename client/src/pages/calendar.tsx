import { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { useCalendar } from "@/hooks/useCalendar";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { EventModal } from "@/components/calendar/EventModal";
import { ConflictModal } from "@/components/calendar/ConflictModal";
import { FilterSidebar } from "@/components/calendar/FilterSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { Event } from "@shared/schema";

export default function Calendar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [conflictingEvents, setConflictingEvents] = useState<Event[]>([]);
  const [pendingEvent, setPendingEvent] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>(["personal", "work", "other"]);

  const { currentDate, navigateMonth, goToToday } = useCalendar();
  const { 
    events, 
    createEvent, 
    updateEvent, 
    deleteEvent, 
    isLoading, 
    checkConflicts 
  } = useEvents();

  // Filter events based on search and category
  const filteredEvents = events?.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter.includes(event.category);
    return matchesSearch && matchesCategory;
  }) || [];

  // Get upcoming events
  const upcomingEvents = filteredEvents
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (event: Event) => {
    setEditingEvent(event);
    setSelectedDate(new Date(event.date));
    setShowEventModal(true);
  };

  const handleEventSubmit = async (eventData: any) => {
    try {
      // Check for conflicts
      const conflicts = await checkConflicts(eventData, editingEvent?.id);
      
      if (conflicts.length > 0) {
        setConflictingEvents(conflicts);
        setPendingEvent(eventData);
        setShowConflictModal(true);
        return;
      }

      if (editingEvent) {
        await updateEvent({ id: editingEvent.id, ...eventData });
      } else {
        await createEvent(eventData);
      }
      
      setShowEventModal(false);
      setEditingEvent(null);
      setSelectedDate(null);
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await deleteEvent(eventId);
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleConflictResolve = async (proceed: boolean) => {
    if (proceed && pendingEvent) {
      try {
        if (editingEvent) {
          await updateEvent({ id: editingEvent.id, ...pendingEvent });
        } else {
          await createEvent(pendingEvent);
        }
        setShowEventModal(false);
        setEditingEvent(null);
        setSelectedDate(null);
      } catch (error) {
        console.error("Failed to save event:", error);
      }
    }
    
    setShowConflictModal(false);
    setConflictingEvents([]);
    setPendingEvent(null);
  };

  const handleEventMove = async (eventId: number, newDate: string) => {
    const event = events?.find(e => e.id === eventId);
    if (event) {
      await updateEvent({ id: eventId, date: newDate });
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const currentMonthEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= monthStart && eventDate <= monthEnd;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Event Calendar</h1>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <Button 
                size="sm" 
                className="bg-primary text-white hover:bg-primary/90"
              >
                Month
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-600">
                Week
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-600">
                Day
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterSidebar(true)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button onClick={() => {
              setEditingEvent(null);
              setSelectedDate(new Date());
              setShowEventModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Calendar Navigation */}
        <Card className="mb-6">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
                  <span>Personal</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-200 rounded-full"></div>
                  <span>Work</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-200 rounded-full"></div>
                  <span>Other</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <CalendarGrid
              currentDate={currentDate}
              events={currentMonthEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              onEventMove={handleEventMove}
              isLoading={isLoading}
            />
          </div>
        </Card>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No upcoming events</p>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${
                          event.category === 'personal' ? 'bg-blue-200' :
                          event.category === 'work' ? 'bg-green-200' : 'bg-orange-200'
                        }`}></div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{event.title}</h4>
                          <p className="text-xs text-gray-500">
                            {format(new Date(event.date), "MMM d, yyyy")} at {event.time}
                          </p>
                          {event.description && (
                            <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
          
          {/* Event Statistics */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">This Month</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {currentMonthEvents.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Events</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {currentMonthEvents.filter(e => new Date(e.date) < new Date()).length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {currentMonthEvents.filter(e => new Date(e.date) >= new Date()).length}
                  </div>
                  <div className="text-sm text-gray-600">Upcoming</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
          setSelectedDate(null);
        }}
        event={editingEvent}
        selectedDate={selectedDate}
        onSubmit={handleEventSubmit}
        onDelete={handleDeleteEvent}
      />

      <ConflictModal
        isOpen={showConflictModal}
        onClose={() => handleConflictResolve(false)}
        conflictingEvents={conflictingEvents}
        onResolve={handleConflictResolve}
      />

      <FilterSidebar
        isOpen={showFilterSidebar}
        onClose={() => setShowFilterSidebar(false)}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />
    </div>
  );
}
