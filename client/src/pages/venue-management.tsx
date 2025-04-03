import React, { useState, useRef, useEffect } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isToday, isTomorrow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  MapPin, Search, Filter, CalendarDays, Clock, Users, CreditCard, Check,
  Plus, ChevronDown, Star, Calendar as CalendarIcon, Bookmark, 
  Share2, ArrowRight, ChevronsUpDown, Loader2, User, Edit, Trash, Eye, ArrowLeft
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

interface VenueFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  capacity: number;
  facilities: string[];
  description: string;
  contactEmail: string;
  contactPhone: string;
  pricePerHour: number;
  latitude: number | null;
  longitude: number | null;
}

interface VenueFilterOptions {
  country: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  area: string | null;
  capacity: number | null;
  facilities: string[] | null;
  priceRange: { min: number | null; max: number | null };
}

export default function VenueManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [filterOptions, setFilterOptions] = useState<VenueFilterOptions>({
    country: null,
    state: null,
    city: null,
    postalCode: null,
    area: null,
    capacity: null,
    facilities: null,
    priceRange: { min: null, max: null }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [venueFormData, setVenueFormData] = useState<VenueFormData>({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    capacity: 0,
    facilities: [],
    description: "",
    contactEmail: "",
    contactPhone: "",
    pricePerHour: 0,
    latitude: null,
    longitude: null
  });
  const [facilityInput, setFacilityInput] = useState("");
  const facilityInputRef = useRef<HTMLInputElement>(null);

  // Define unique filter options
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);
  const [uniqueStates, setUniqueStates] = useState<string[]>([]);
  const [uniqueCities, setUniqueCities] = useState<string[]>([]);
  const [uniquePostalCodes, setUniquePostalCodes] = useState<string[]>([]);

  // Fetch Venues
  const { data: venues, isLoading, error } = useQuery({
    queryKey: ['/api/venues'],
    select: (data: Venue[]) => data
  });

  // Extract filter options from venues
  useEffect(() => {
    if (venues) {
      // Extract unique values for filter dropdowns
      const countries = Array.from(new Set(venues.map(v => v.country))).filter(Boolean) as string[];
      const states = Array.from(new Set(venues.map(v => v.state))).filter(Boolean) as string[];
      const cities = Array.from(new Set(venues.map(v => v.city))).filter(Boolean) as string[];
      const postalCodes = Array.from(new Set(venues.map(v => v.postalCode))).filter(Boolean) as string[];
      
      setUniqueCountries(countries);
      setUniqueStates(states);
      setUniqueCities(cities);
      setUniquePostalCodes(postalCodes);
    }
  }, [venues]);

  // Create venue mutation
  const createVenueMutation = useMutation({
    mutationFn: async (data: VenueFormData) => {
      return await apiRequest('POST', '/api/venues', data);
    },
    onSuccess: () => {
      toast({
        title: "Venue created",
        description: "The venue has been created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create venue",
        variant: "destructive"
      });
    }
  });

  // Update venue mutation
  const updateVenueMutation = useMutation({
    mutationFn: async (data: { id: number, venue: Partial<VenueFormData> }) => {
      return await apiRequest('PATCH', `/api/venues/${data.id}`, data.venue);
    },
    onSuccess: () => {
      toast({
        title: "Venue updated",
        description: "The venue has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
      setIsEditDialogOpen(false);
      setActiveVenue(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update venue",
        variant: "destructive"
      });
    }
  });

  // Delete venue mutation
  const deleteVenueMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/venues/${id}`, null);
    },
    onSuccess: () => {
      toast({
        title: "Venue deleted",
        description: "The venue has been deleted successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete venue",
        variant: "destructive"
      });
    }
  });

  // Form handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (name === 'capacity' || name === 'pricePerHour') {
      setVenueFormData({
        ...venueFormData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setVenueFormData({
        ...venueFormData,
        [name]: value
      });
    }
  };

  const handleAddFacility = () => {
    if (facilityInput.trim()) {
      setVenueFormData({
        ...venueFormData,
        facilities: [...venueFormData.facilities, facilityInput.trim()]
      });
      setFacilityInput("");
      if (facilityInputRef.current) {
        facilityInputRef.current.focus();
      }
    }
  };

  const handleRemoveFacility = (facility: string) => {
    setVenueFormData({
      ...venueFormData,
      facilities: venueFormData.facilities.filter(f => f !== facility)
    });
  };

  const resetForm = () => {
    setVenueFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      capacity: 0,
      facilities: [],
      description: "",
      contactEmail: "",
      contactPhone: "",
      pricePerHour: 0,
      latitude: null,
      longitude: null
    });
    setFacilityInput("");
  };

  const handleEditVenue = (venue: Venue) => {
    setActiveVenue(venue);
    setVenueFormData({
      name: venue.name,
      address: venue.address,
      city: venue.city,
      state: venue.state || "",
      country: venue.country,
      postalCode: venue.postalCode || "",
      capacity: venue.capacity || 0,
      facilities: venue.facilities || [],
      description: venue.description || "",
      contactEmail: venue.contactEmail || "",
      contactPhone: venue.contactPhone || "",
      pricePerHour: venue.pricePerHour || 0,
      latitude: venue.latitude,
      longitude: venue.longitude
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createVenueMutation.mutate(venueFormData);
  };

  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeVenue) {
      updateVenueMutation.mutate({
        id: activeVenue.id,
        venue: venueFormData
      });
    }
  };

  const handleDeleteVenue = (id: number) => {
    if (window.confirm("Are you sure you want to delete this venue? This action cannot be undone.")) {
      deleteVenueMutation.mutate(id);
    }
  };

  // Filter handling
  const handleFilterChange = (key: keyof VenueFilterOptions, value: any) => {
    if (key === 'priceRange') {
      setFilterOptions({
        ...filterOptions,
        priceRange: value
      });
    } else {
      setFilterOptions({
        ...filterOptions,
        [key]: value
      });
    }
  };

  const resetFilters = () => {
    setFilterOptions({
      country: null,
      state: null,
      city: null,
      postalCode: null,
      area: null,
      capacity: null,
      facilities: null,
      priceRange: { min: null, max: null }
    });
  };

  // Apply filters to venues
  const filteredVenues = venues ? venues.filter(venue => {
    if (filterOptions.country && venue.country !== filterOptions.country) return false;
    if (filterOptions.state && venue.state !== filterOptions.state) return false;
    if (filterOptions.city && venue.city !== filterOptions.city) return false;
    if (filterOptions.postalCode && venue.postalCode !== filterOptions.postalCode) return false;
    if (filterOptions.area && !venue.address.toLowerCase().includes(filterOptions.area.toLowerCase())) return false;
    if (filterOptions.capacity && venue.capacity && venue.capacity < filterOptions.capacity) return false;
    if (filterOptions.priceRange.min && venue.pricePerHour && venue.pricePerHour < filterOptions.priceRange.min) return false;
    if (filterOptions.priceRange.max && venue.pricePerHour && venue.pricePerHour > filterOptions.priceRange.max) return false;
    
    if (filterOptions.facilities && filterOptions.facilities.length > 0) {
      // Check if venue has all the selected facilities
      if (!venue.facilities || !Array.isArray(venue.facilities)) return false;
      return filterOptions.facilities.every(f => venue.facilities.includes(f));
    }
    
    return true;
  }) : [];

  // Get all unique facilities from venues
  const allFacilities = venues 
    ? Array.from(new Set(venues.flatMap(v => v.facilities || [])))
    : [];

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/venue-discovery">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Discovery
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Venue Management</h1>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Venue
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Venue Filters</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
          <CardDescription>
            Filter venues based on location, capacity, facilities, and more
          </CardDescription>
        </CardHeader>
        
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select 
                  value={filterOptions.country || ''} 
                  onValueChange={(value) => handleFilterChange('country', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Countries</SelectItem>
                    {uniqueCountries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Select 
                  value={filterOptions.state || ''} 
                  onValueChange={(value) => handleFilterChange('state', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All States</SelectItem>
                    {uniqueStates.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select 
                  value={filterOptions.city || ''} 
                  onValueChange={(value) => handleFilterChange('city', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Cities</SelectItem>
                    {uniqueCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal/Pin Code</Label>
                <Select 
                  value={filterOptions.postalCode || ''} 
                  onValueChange={(value) => handleFilterChange('postalCode', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a postal code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Postal Codes</SelectItem>
                    {uniquePostalCodes.map(code => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area/Locality</Label>
                <Input 
                  id="area" 
                  placeholder="Enter area/locality" 
                  value={filterOptions.area || ''} 
                  onChange={(e) => handleFilterChange('area', e.target.value || null)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Minimum Capacity</Label>
                <Input 
                  id="capacity" 
                  type="number" 
                  placeholder="Min. capacity" 
                  value={filterOptions.capacity || ''} 
                  onChange={(e) => handleFilterChange('capacity', e.target.value ? parseInt(e.target.value) : null)} 
                />
              </div>

              <div className="space-y-2">
                <Label>Price Range (per hour)</Label>
                <div className="flex space-x-2">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    value={filterOptions.priceRange.min || ''} 
                    onChange={(e) => handleFilterChange('priceRange', { 
                      ...filterOptions.priceRange, 
                      min: e.target.value ? parseFloat(e.target.value) : null 
                    })} 
                  />
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    value={filterOptions.priceRange.max || ''} 
                    onChange={(e) => handleFilterChange('priceRange', { 
                      ...filterOptions.priceRange, 
                      max: e.target.value ? parseFloat(e.target.value) : null 
                    })} 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
              <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Venues</CardTitle>
          <CardDescription>
            {filteredVenues.length} {filteredVenues.length === 1 ? 'venue' : 'venues'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center text-destructive p-6">
              Failed to load venues. Please try again.
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="text-center text-muted-foreground p-6">
              No venues found with the selected filters.
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Facilities</TableHead>
                    <TableHead>Price/Hour</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVenues.map((venue) => (
                    <TableRow key={venue.id}>
                      <TableCell className="font-medium">{venue.name}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <div>{venue.city}, {venue.country}</div>
                            <div className="text-xs text-muted-foreground">{venue.address}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{venue.capacity || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {venue.facilities && venue.facilities.length > 0 ? (
                            venue.facilities.slice(0, 3).map((facility, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {facility}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">None listed</span>
                          )}
                          {venue.facilities && venue.facilities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{venue.facilities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {venue.pricePerHour 
                          ? `$${venue.pricePerHour.toFixed(2)}` 
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditVenue(venue)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteVenue(venue.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Venue Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Venue</DialogTitle>
            <DialogDescription>
              Enter the details for the new venue. Required fields are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input 
                  id="name"
                  name="name"
                  value={venueFormData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input 
                  id="address"
                  name="address"
                  value={venueFormData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input 
                  id="city"
                  name="city"
                  value={venueFormData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input 
                  id="state"
                  name="state"
                  value={venueFormData.state}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input 
                  id="country"
                  name="country"
                  value={venueFormData.country}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal/Pin Code</Label>
                <Input 
                  id="postalCode"
                  name="postalCode"
                  value={venueFormData.postalCode}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input 
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={venueFormData.capacity}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pricePerHour">Price Per Hour ($)</Label>
                <Input 
                  id="pricePerHour"
                  name="pricePerHour"
                  type="number"
                  step="0.01"
                  value={venueFormData.pricePerHour}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input 
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={venueFormData.contactEmail}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input 
                  id="contactPhone"
                  name="contactPhone"
                  value={venueFormData.contactPhone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="facilities">Facilities</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="facilityInput"
                    ref={facilityInputRef}
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    placeholder="Add facility (e.g., Parking, WiFi)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFacility())}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddFacility} 
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {venueFormData.facilities.map((facility, index) => (
                    <Badge key={index} variant="secondary">
                      {facility}
                      <button
                        type="button"
                        className="ml-1 text-xs font-bold"
                        onClick={() => handleRemoveFacility(facility)}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {venueFormData.facilities.length === 0 && (
                    <span className="text-sm text-muted-foreground">No facilities added</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  name="description"
                  value={venueFormData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input 
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="0.000001"
                  value={venueFormData.latitude || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 40.7128"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input 
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="0.000001"
                  value={venueFormData.longitude || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createVenueMutation.isPending}>
                {createVenueMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Venue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Venue Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Venue</DialogTitle>
            <DialogDescription>
              Update the details for {activeVenue?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input 
                  id="edit-name"
                  name="name"
                  value={venueFormData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address *</Label>
                <Input 
                  id="edit-address"
                  name="address"
                  value={venueFormData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-city">City *</Label>
                <Input 
                  id="edit-city"
                  name="city"
                  value={venueFormData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-state">State/Province</Label>
                <Input 
                  id="edit-state"
                  name="state"
                  value={venueFormData.state}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country *</Label>
                <Input 
                  id="edit-country"
                  name="country"
                  value={venueFormData.country}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-postalCode">Postal/Pin Code</Label>
                <Input 
                  id="edit-postalCode"
                  name="postalCode"
                  value={venueFormData.postalCode}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input 
                  id="edit-capacity"
                  name="capacity"
                  type="number"
                  value={venueFormData.capacity}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-pricePerHour">Price Per Hour ($)</Label>
                <Input 
                  id="edit-pricePerHour"
                  name="pricePerHour"
                  type="number"
                  step="0.01"
                  value={venueFormData.pricePerHour}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-contactEmail">Contact Email</Label>
                <Input 
                  id="edit-contactEmail"
                  name="contactEmail"
                  type="email"
                  value={venueFormData.contactEmail}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                <Input 
                  id="edit-contactPhone"
                  name="contactPhone"
                  value={venueFormData.contactPhone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-facilities">Facilities</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="edit-facilityInput"
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    placeholder="Add facility (e.g., Parking, WiFi)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFacility())}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddFacility} 
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {venueFormData.facilities.map((facility, index) => (
                    <Badge key={index} variant="secondary">
                      {facility}
                      <button
                        type="button"
                        className="ml-1 text-xs font-bold"
                        onClick={() => handleRemoveFacility(facility)}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {venueFormData.facilities.length === 0 && (
                    <span className="text-sm text-muted-foreground">No facilities added</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description"
                  name="description"
                  value={venueFormData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input 
                  id="edit-latitude"
                  name="latitude"
                  type="number"
                  step="0.000001"
                  value={venueFormData.latitude || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 40.7128"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input 
                  id="edit-longitude"
                  name="longitude"
                  type="number"
                  step="0.000001"
                  value={venueFormData.longitude || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateVenueMutation.isPending}>
                {updateVenueMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Venue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}