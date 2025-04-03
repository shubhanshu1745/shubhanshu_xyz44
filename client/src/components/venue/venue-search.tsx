import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, CheckCircleIcon } from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Venue } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";

interface VenueSearchProps {
  onVenueSelect: (venue: Venue | null) => void;
  selectedVenue?: Venue | null;
  label?: string;
  placeholder?: string;
  required?: boolean;
  showSelectedVenue?: boolean;
  className?: string;
  multiple?: boolean;
  selectedVenues?: Venue[];
  onVenuesChange?: (venues: Venue[]) => void;
}

export function VenueSearch({
  onVenueSelect,
  selectedVenue,
  label = "Venue",
  placeholder = "Search venues...",
  required = false,
  showSelectedVenue = true,
  className = "",
  multiple = false,
  selectedVenues = [],
  onVenuesChange,
}: VenueSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [facilities, setFacilities] = useState<string[]>([]);

  // Get all venues
  const {
    data: venues,
    isLoading,
    error,
  } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
  });

  // Get countries for filter dropdown
  const {
    data: countries,
  } = useQuery<string[]>({
    queryKey: ["/api/venues/countries"],
  });

  // Get states for selected country
  const {
    data: states,
  } = useQuery<string[]>({
    queryKey: ["/api/venues/states", country],
    enabled: !!country,
  });

  // Get cities for selected state
  const {
    data: cities,
  } = useQuery<string[]>({
    queryKey: ["/api/venues/cities", country, state],
    enabled: !!country && !!state,
  });

  // Get facility options
  const {
    data: facilityOptions,
  } = useQuery<string[]>({
    queryKey: ["/api/venues/facilities"],
  });

  const filteredVenues = venues?.filter((venue) => {
    // Apply search text filter
    const matchesSearch =
      !search ||
      venue.name.toLowerCase().includes(search.toLowerCase()) ||
      venue.city?.toLowerCase().includes(search.toLowerCase()) ||
      venue.country?.toLowerCase().includes(search.toLowerCase());

    // Apply country filter
    const matchesCountry = !country || venue.country === country;

    // Apply state filter
    const matchesState = !state || venue.state === state;

    // Apply city filter
    const matchesCity = !city || venue.city === city;

    // Apply capacity filter
    const matchesCapacity =
      !capacity || (venue.capacity && venue.capacity >= capacity);

    // Apply facilities filter
    const matchesFacilities =
      facilities.length === 0 ||
      facilities.every((facility) =>
        venue.facilities?.includes(facility)
      );

    return (
      matchesSearch &&
      matchesCountry &&
      matchesState &&
      matchesCity &&
      matchesCapacity &&
      matchesFacilities
    );
  });

  // Reset filters when popover is closed
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Handle adding/removing venues in multiple selection mode
  const handleVenueToggle = (venue: Venue) => {
    if (!multiple) {
      onVenueSelect(venue);
      setOpen(false);
      return;
    }

    if (onVenuesChange) {
      const isSelected = selectedVenues.some((v) => v.id === venue.id);
      if (isSelected) {
        onVenuesChange(selectedVenues.filter((v) => v.id !== venue.id));
      } else {
        onVenuesChange([...selectedVenues, venue]);
      }
    }
  };

  // Check if a venue is selected in multiple selection mode
  const isVenueSelected = (venue: Venue) => {
    return selectedVenues.some((v) => v.id === venue.id);
  };

  // Reset all filters
  const resetFilters = () => {
    setCountry(null);
    setState(null);
    setCity(null);
    setCapacity(null);
    setFacilities([]);
    setSearch("");
  };

  // Toggle a facility filter
  const toggleFacility = (facility: string) => {
    if (facilities.includes(facility)) {
      setFacilities(facilities.filter((f) => f !== facility));
    } else {
      setFacilities([...facilities, facility]);
    }
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="venue-search" className="mb-2 block">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {multiple
              ? selectedVenues.length > 0
                ? `${selectedVenues.length} venue${
                    selectedVenues.length !== 1 ? "s" : ""
                  } selected`
                : placeholder
              : selectedVenue?.name || placeholder}
            <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] max-h-[600px] p-0" align="start">
          <div className="flex flex-col">
            <Command>
              <CommandInput
                placeholder="Search venues..."
                value={search}
                onValueChange={setSearch}
              />

              {/* Filters */}
              <div className="border-t p-2 space-y-2">
                <div className="text-sm font-medium">Filters</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="country-filter" className="text-xs">Country</Label>
                    <Select value={country || ""} onValueChange={(v) => { setCountry(v || null); setState(null); setCity(null); }}>
                      <SelectTrigger id="country-filter" className="h-8">
                        <SelectValue placeholder="Any country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any country</SelectItem>
                        {countries?.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="state-filter" className="text-xs">State/Province</Label>
                    <Select 
                      value={state || ""} 
                      onValueChange={(v) => { setState(v || null); setCity(null); }}
                      disabled={!country}
                    >
                      <SelectTrigger id="state-filter" className="h-8">
                        <SelectValue placeholder="Any state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any state</SelectItem>
                        {states?.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city-filter" className="text-xs">City</Label>
                    <Select 
                      value={city || ""} 
                      onValueChange={(v) => setCity(v || null)}
                      disabled={!state}
                    >
                      <SelectTrigger id="city-filter" className="h-8">
                        <SelectValue placeholder="Any city" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any city</SelectItem>
                        {cities?.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="capacity-filter" className="text-xs">Min. Capacity</Label>
                    <Select 
                      value={capacity?.toString() || ""} 
                      onValueChange={(v) => setCapacity(v ? parseInt(v) : null)}
                    >
                      <SelectTrigger id="capacity-filter" className="h-8">
                        <SelectValue placeholder="Any capacity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any capacity</SelectItem>
                        <SelectItem value="10000">10,000+</SelectItem>
                        <SelectItem value="20000">20,000+</SelectItem>
                        <SelectItem value="30000">30,000+</SelectItem>
                        <SelectItem value="50000">50,000+</SelectItem>
                        <SelectItem value="100000">100,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Facilities filter */}
                {facilityOptions && facilityOptions.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-xs">Facilities</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {facilityOptions.slice(0, 6).map((facility) => (
                        <div key={facility} className="flex items-center space-x-1">
                          <Checkbox 
                            id={`facility-${facility}`}
                            checked={facilities.includes(facility)}
                            onCheckedChange={() => toggleFacility(facility)}
                          />
                          <Label htmlFor={`facility-${facility}`} className="text-xs cursor-pointer">
                            {facility}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="text-xs h-7"
                  >
                    Reset filters
                  </Button>
                </div>
              </div>

              <CommandList>
                {isLoading && (
                  <div className="py-6 text-center">
                    <Spinner className="mx-auto" />
                    <div className="mt-2 text-sm text-muted-foreground">
                      Loading venues...
                    </div>
                  </div>
                )}

                {error && (
                  <div className="py-6 text-center text-destructive">
                    Error loading venues.
                  </div>
                )}

                {!isLoading && !error && (
                  <>
                    <CommandEmpty>No venues found.</CommandEmpty>
                    <CommandGroup>
                      {filteredVenues?.map((venue) => (
                        <CommandItem
                          key={venue.id}
                          value={`${venue.id}-${venue.name}`}
                          onSelect={() => handleVenueToggle(venue)}
                          className="flex justify-between"
                        >
                          <div className="flex flex-col">
                            <span>{venue.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {venue.city}, {venue.state && `${venue.state}, `}
                              {venue.country} ({venue.capacity?.toLocaleString() || "Unknown"} capacity)
                            </span>
                          </div>
                          {multiple ? (
                            <Checkbox checked={isVenueSelected(venue)} className="ml-2" />
                          ) : (
                            selectedVenue?.id === venue.id && (
                              <CheckCircleIcon className="h-4 w-4 text-primary" />
                            )
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </div>
        </PopoverContent>
      </Popover>

      {/* Display selected venue (for single venue selection) */}
      {showSelectedVenue && !multiple && selectedVenue && (
        <div className="mt-2 p-2 rounded-md border bg-background">
          <div className="flex justify-between">
            <div>
              <div className="font-medium">{selectedVenue.name}</div>
              <div className="text-sm text-muted-foreground">
                {selectedVenue.city}, {selectedVenue.state && `${selectedVenue.state}, `}
                {selectedVenue.country}
              </div>
              <div className="text-sm text-muted-foreground">
                Capacity: {selectedVenue.capacity?.toLocaleString() || "Unknown"}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVenueSelect(null)}
              className="h-8 self-start"
            >
              Change
            </Button>
          </div>
          {selectedVenue.facilities && selectedVenue.facilities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedVenue.facilities.map((facility) => (
                <Badge key={facility} variant="secondary" className="text-xs">
                  {facility}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Display selected venues (for multiple venue selection) */}
      {multiple && selectedVenues && selectedVenues.length > 0 && (
        <div className="mt-2 p-2 rounded-md border bg-background max-h-40 overflow-y-auto">
          <div className="text-sm font-medium mb-1">Selected venues ({selectedVenues.length})</div>
          <div className="space-y-1">
            {selectedVenues.map((venue) => (
              <div key={venue.id} className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-medium">{venue.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({venue.city}, {venue.country})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onVenuesChange) {
                      onVenuesChange(selectedVenues.filter((v) => v.id !== venue.id));
                    }
                  }}
                  className="h-6 px-2"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}