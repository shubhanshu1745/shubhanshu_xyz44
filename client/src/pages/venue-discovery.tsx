import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import {
  MapPin, Search, Filter, CalendarDays, Clock, Users, CreditCard, Check,
  Plus, ChevronDown, Star, Calendar as CalendarIcon, Bookmark, 
  Share2, ArrowRight, ChevronsUpDown, Loader2, User
} from "lucide-react";

// Types
interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  capacity: number | null;
  facilities: string[];
  description: string | null;
  imageUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  pricePerHour: number | null;
  isActive: boolean;
  createdBy: number;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

interface VenueAvailability {
  id: number;
  venueId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface VenueBooking {
  id: number;
  venueId: number;
  userId: number;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  numberOfPeople: number | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "partial" | "paid";
  totalAmount: number | null;
  paidAmount: number | null;
  transactionId: string | null;
  notes: string | null;
  tournamentId: number | null;
  createdAt: string;
  updatedAt: string;
  venue?: Venue;
}

// Venue Discovery Page
export default function VenueDiscovery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [facilityFilters, setFacilityFilters] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{start: string, end: string} | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingPurpose, setBookingPurpose] = useState("");
  const [attendees, setAttendees] = useState<number | null>(null);
  const [userVenues, setUserVenues] = useState<Venue[]>([]);
  const [bookingViewMode, setBookingViewMode] = useState<"upcoming" | "past" | "all">("upcoming");
  const [userBookings, setUserBookings] = useState<VenueBooking[]>([]);
  
  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Store coordinates for nearby venue search
          localStorage.setItem("userLat", position.coords.latitude.toString());
          localStorage.setItem("userLng", position.coords.longitude.toString());
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);
  
  // Query venues
  const { data: venues, isLoading } = useQuery({
    queryKey: ['/api/venues', searchQuery, locationFilter],
    queryFn: async () => {
      let url = '/api/venues';
      
      if (searchQuery || locationFilter) {
        url += `?query=${searchQuery}&location=${locationFilter}`;
      }
      
      const response = await apiRequest(url);
      if (!response.ok) throw new Error('Failed to fetch venues');
      return await response.json();
    }
  });
  
  // Query nearby venues
  const { data: nearbyVenues, isLoading: nearbyLoading } = useQuery({
    queryKey: ['/api/venues/nearby'],
    queryFn: async () => {
      const userLat = localStorage.getItem("userLat");
      const userLng = localStorage.getItem("userLng");
      
      if (!userLat || !userLng) return [];
      
      const response = await apiRequest(`/api/venues/nearby?lat=${userLat}&lng=${userLng}&radius=20`);
      if (!response.ok) throw new Error('Failed to fetch nearby venues');
      return await response.json();
    },
    enabled: !!localStorage.getItem("userLat") && !!localStorage.getItem("userLng")
  });
  
  // Query venue availability when a venue is selected
  const { data: venueAvailabilities } = useQuery({
    queryKey: ['/api/venues', selectedVenue?.id, 'availability'],
    queryFn: async () => {
      if (!selectedVenue) return [];
      const response = await apiRequest(`/api/venues/${selectedVenue.id}/availability`);
      if (!response.ok) throw new Error('Failed to fetch venue availability');
      return await response.json();
    },
    enabled: !!selectedVenue
  });
  
  // Query user's venues (venues they own/manage)
  const { data: managedVenues } = useQuery({
    queryKey: ['/api/users/me/venues'],
    queryFn: async () => {
      if (!user) return [];
      const response = await apiRequest('/api/users/me/venues');
      if (!response.ok) throw new Error('Failed to fetch your venues');
      return await response.json();
    },
    enabled: !!user
  });
  
  // Query user's bookings
  const { data: bookings } = useQuery({
    queryKey: ['/api/users/me/bookings', bookingViewMode],
    queryFn: async () => {
      if (!user) return [];
      let url = '/api/users/me/bookings';
      if (bookingViewMode !== 'all') {
        url += `?status=${bookingViewMode}`;
      }
      const response = await apiRequest(url);
      if (!response.ok) throw new Error('Failed to fetch your bookings');
      return await response.json();
    },
    enabled: !!user
  });
  
  // Effect to set user venues and bookings when the data changes
  useEffect(() => {
    if (managedVenues) {
      setUserVenues(managedVenues);
    }
    if (bookings) {
      setUserBookings(bookings);
    }
  }, [managedVenues, bookings]);
  
  // Mutation to create a booking
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      if (!selectedVenue) throw new Error('No venue selected');
      
      const response = await apiRequest(`/api/venues/${selectedVenue.id}/bookings`, {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/bookings'] });
      toast({
        title: "Booking Created",
        description: "Your venue booking has been created successfully."
      });
      setBookingDialogOpen(false);
      // Reset booking form
      setSelectedTimeSlot(null);
      setBookingPurpose("");
      setAttendees(null);
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error creating your booking.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to cancel a booking
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiRequest(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/bookings'] });
      toast({
        title: "Booking Cancelled",
        description: "Your venue booking has been cancelled."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "There was an error cancelling your booking.",
        variant: "destructive"
      });
    }
  });
  
  // Helper function to generate time slots based on venue availability
  const generateTimeSlots = () => {
    if (!selectedVenue || !venueAvailabilities || !selectedDate) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const availability = venueAvailabilities.find(a => a.dayOfWeek === dayOfWeek);
    
    if (!availability) return [];
    
    const slots = [];
    const [startHour, startMinute] = availability.startTime.split(':').map(Number);
    const [endHour, endMinute] = availability.endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    // Generate 1-hour slots
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const nextHour = currentMinute + 60 >= 60 ? currentHour + 1 : currentHour;
      const nextMinute = (currentMinute + 60) % 60;
      
      if (nextHour > endHour || (nextHour === endHour && nextMinute > endMinute)) {
        break;
      }
      
      const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      const endTime = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
      
      slots.push({ start: startTime, end: endTime });
      
      currentHour = nextHour;
      currentMinute = nextMinute;
    }
    
    return slots;
  };
  
  // Handle booking creation
  const handleCreateBooking = () => {
    if (!selectedVenue || !selectedDate || !selectedTimeSlot) {
      toast({
        title: "Incomplete Form",
        description: "Please select a venue, date, and time slot.",
        variant: "destructive"
      });
      return;
    }
    
    const bookingData = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedTimeSlot.start,
      endTime: selectedTimeSlot.end,
      purpose: bookingPurpose || "Cricket practice",
      numberOfPeople: attendees,
    };
    
    createBookingMutation.mutate(bookingData);
  };
  
  // Handle booking cancellation
  const handleCancelBooking = (bookingId: number) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      cancelBookingMutation.mutate(bookingId);
    }
  };
  
  // Helper function to display venue facilities as badges
  const renderFacilities = (facilities: string[]) => {
    return facilities.map((facility, index) => (
      <Badge key={index} variant="outline" className="mr-1 mb-1">
        {facility}
      </Badge>
    ));
  };
  
  // Render venue cards
  const renderVenueCard = (venue: Venue) => (
    <Card key={venue.id} className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div 
          className="h-48 bg-cover bg-center relative" 
          style={{ 
            backgroundImage: venue.imageUrl 
              ? `url(${venue.imageUrl})` 
              : "url('/assets/default-venue.jpg')" 
          }}
        >
          {venue.pricePerHour && (
            <Badge className="absolute top-2 right-2 bg-white text-black font-semibold">
              ₹{venue.pricePerHour}/hour
            </Badge>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-1">{venue.name}</h3>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <MapPin size={16} className="mr-1" />
            <span>{venue.city}, {venue.country}</span>
          </div>
          <div className="mb-3">
            {venue.facilities && renderFacilities(venue.facilities)}
          </div>
          <div className="flex justify-between items-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedVenue(venue);
                setBookingDialogOpen(true);
              }}
            >
              Book Now
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedVenue(venue)}
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Render user's bookings
  const renderBookings = () => {
    if (!userBookings || userBookings.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">You don't have any {bookingViewMode} bookings.</p>
          <Button 
            variant="outline" 
            onClick={() => setBookingViewMode('all')} 
            className="mt-4"
          >
            View All Bookings
          </Button>
        </div>
      );
    }
    
    return userBookings.map(booking => (
      <Card key={booking.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{booking.venue?.name || 'Venue'}</CardTitle>
              <CardDescription>
                {format(new Date(booking.date), 'PPP')} • {booking.startTime} - {booking.endTime}
              </CardDescription>
            </div>
            <Badge 
              variant={
                booking.status === 'confirmed' ? 'default' : 
                booking.status === 'pending' ? 'outline' : 
                booking.status === 'cancelled' ? 'destructive' : 
                'secondary'
              }
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <MapPin size={16} className="mr-2 text-gray-500" />
              <span>{booking.venue?.city}, {booking.venue?.country}</span>
            </div>
            <div className="flex items-center">
              <Users size={16} className="mr-2 text-gray-500" />
              <span>{booking.numberOfPeople || 'N/A'} attendees</span>
            </div>
            <div className="flex items-center">
              <CreditCard size={16} className="mr-2 text-gray-500" />
              <span>{booking.paymentStatus}</span>
            </div>
            {booking.purpose && (
              <div className="flex items-center col-span-2">
                <Star size={16} className="mr-2 text-gray-500" />
                <span>{booking.purpose}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <Button 
              variant="destructive" 
              onClick={() => handleCancelBooking(booking.id)}
            >
              Cancel
            </Button>
          )}
          <Button variant="outline">
            Share Details
          </Button>
        </CardFooter>
      </Card>
    ));
  };
  
  // Main view
  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="discover">Discover Venues</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          {userVenues && userVenues.length > 0 && (
            <TabsTrigger value="manage">Manage Venues</TabsTrigger>
          )}
        </TabsList>
        
        {/* Discover Tab */}
        <TabsContent value="discover">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <Input
                  placeholder="Search for venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter size={18} />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Location</Label>
                      <Input 
                        placeholder="City or area"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Facilities</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {['Floodlights', 'Parking', 'Changing Rooms', 'Pavilion', 'Practice Nets', 'Electronic Scoreboard'].map(facility => (
                          <div key={facility} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`facility-${facility}`}
                              checked={facilityFilters.includes(facility)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFacilityFilters([...facilityFilters, facility]);
                                } else {
                                  setFacilityFilters(facilityFilters.filter(f => f !== facility));
                                }
                              }}
                            />
                            <label htmlFor={`facility-${facility}`}>{facility}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="mb-4">
                    <CardContent className="p-0">
                      <div className="h-48 bg-gray-200 animate-pulse"></div>
                      <div className="p-4 space-y-2">
                        <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                        <div className="h-8 mt-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : venues && venues.length > 0 ? (
                venues.map(renderVenueCard)
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500 mb-4">No venues found matching your criteria.</p>
                  <Button onClick={() => { setSearchQuery(""); setLocationFilter(""); setFacilityFilters([]); }}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {nearbyVenues && nearbyVenues.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Venues Near You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyVenues.map(renderVenueCard)}
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Bookings</h2>
              <Select
                value={bookingViewMode}
                onValueChange={(value: "upcoming" | "past" | "all") => setBookingViewMode(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter bookings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="all">All Bookings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {renderBookings()}
          </div>
        </TabsContent>
        
        {/* Manage Venues Tab (for venue owners) */}
        <TabsContent value="manage">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Venues</h2>
              <Button>
                <Plus size={16} className="mr-1" />
                Add New Venue
              </Button>
            </div>
            
            {userVenues && userVenues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userVenues.map(venue => (
                  <Card key={venue.id} className="mb-4">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{venue.name}</CardTitle>
                        <Badge variant={venue.isActive ? 'default' : 'destructive'}>
                          {venue.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardDescription>{venue.city}, {venue.country}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {venue.facilities && venue.facilities.length > 0 && (
                          <div>
                            {renderFacilities(venue.facilities)}
                          </div>
                        )}
                        {venue.pricePerHour && (
                          <p className="text-sm">Price: ₹{venue.pricePerHour}/hour</p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">
                        Manage Bookings
                      </Button>
                      <Button variant="outline">
                        Edit Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You don't have any venues yet.</p>
                <Button>
                  <Plus size={16} className="mr-1" />
                  Register a Venue
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book {selectedVenue?.name}</DialogTitle>
            <DialogDescription>
              Select a date and time to book this venue for your cricket events.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date()}
                  className="border rounded-md p-3"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Available Time Slots</Label>
                <ScrollArea className="h-[280px] border rounded-md p-3">
                  {generateTimeSlots().length > 0 ? (
                    <div className="space-y-2">
                      {generateTimeSlots().map((slot, index) => (
                        <div 
                          key={index}
                          className={`
                            p-2 border rounded cursor-pointer transition-colors
                            ${selectedTimeSlot?.start === slot.start ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                          `}
                          onClick={() => setSelectedTimeSlot(slot)}
                        >
                          {slot.start} - {slot.end}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No available time slots for this date.
                    </p>
                  )}
                </ScrollArea>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Purpose of Booking</Label>
              <Select onValueChange={setBookingPurpose} defaultValue="practice">
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="practice">Cricket Practice</SelectItem>
                  <SelectItem value="match">Cricket Match</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="coaching">Coaching Session</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Number of Attendees</Label>
              <Input 
                type="number" 
                min="1" 
                placeholder="Enter number of people" 
                value={attendees || ''}
                onChange={(e) => setAttendees(parseInt(e.target.value) || null)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleCreateBooking}
              disabled={!selectedTimeSlot}
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}