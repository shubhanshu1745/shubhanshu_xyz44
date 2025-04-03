// World Cricket Venues Data
// Contains top cricket venues from India and around the world

export interface VenueData {
  name: string;
  city: string;
  state?: string;
  country: string;
  capacity: number;
  attributes: string[];
  coordinates?: { lat: number; lng: number };
  facilities?: string[];
  established?: number;
  homeTeams?: string[];
  postalCode?: string;
}

// India's major cricket venues
export const indianVenues: VenueData[] = [
  // Major Indian Venues
  {
    name: "M. A. Chidambaram Stadium",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    capacity: 50000,
    attributes: ["Spin-friendly", "Slow track", "Home to Chennai Super Kings"],
    coordinates: { lat: 13.0629, lng: 80.2792 },
    facilities: ["Parking", "Food & Beverages", "Media Box", "Player Facilities", "Premium Seating"],
    established: 1916,
    homeTeams: ["Chennai Super Kings", "Tamil Nadu"],
    postalCode: "600004"
  },
  {
    name: "Wankhede Stadium",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    capacity: 33108,
    attributes: ["Good batting track", "Swing early on", "Home to Mumbai Indians"],
    coordinates: { lat: 18.9389, lng: 72.8258 },
    facilities: ["Parking", "Food & Beverages", "Media Box", "VIP Lounges", "Premium Seating"],
    established: 1974,
    homeTeams: ["Mumbai Indians", "Mumbai"],
    postalCode: "400005"
  },
  {
    name: "Eden Gardens",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    capacity: 68000,
    attributes: ["Historic venue", "Good pace and bounce", "Home to Kolkata Knight Riders"],
    coordinates: { lat: 22.5646, lng: 88.3433 },
    facilities: ["Parking", "Food & Beverages", "Media Box", "Premium Facilities", "Club House"],
    established: 1864,
    homeTeams: ["Kolkata Knight Riders", "Bengal"],
    postalCode: "700021"
  },
  {
    name: "Arun Jaitley Stadium",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    capacity: 41820,
    attributes: ["Batting-friendly", "Good for power hitters", "Home to Delhi Capitals"],
    coordinates: { lat: 28.6383, lng: 77.2431 },
    facilities: ["Parking", "Food & Beverages", "Media Box", "Premium Seating"],
    established: 1883,
    homeTeams: ["Delhi Capitals", "Delhi"],
    postalCode: "110002"
  },
  {
    name: "M. Chinnaswamy Stadium", 
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    capacity: 40000,
    attributes: ["Batting paradise", "High scoring", "Home to Royal Challengers Bangalore"],
    coordinates: { lat: 12.9788, lng: 77.5996 },
    facilities: ["Parking", "Food & Beverages", "Media Box", "Solar Power Panels", "Rain Water Harvesting"],
    established: 1969,
    homeTeams: ["Royal Challengers Bangalore", "Karnataka"],
    postalCode: "560001"
  },
  {
    name: "Narendra Modi Stadium",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    capacity: 132000,
    attributes: ["Largest cricket stadium", "New venue", "Home to Gujarat Titans"],
    coordinates: { lat: 23.0917, lng: 72.5972 },
    facilities: ["Parking", "Food & Beverages", "Media Box", "Olympic-size Swimming Pool", "Indoor Academy"],
    established: 1982,
    homeTeams: ["Gujarat Titans", "Gujarat"],
    postalCode: "380063"
  },
  {
    name: "Rajiv Gandhi International Stadium",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    capacity: 39000,
    attributes: ["Balanced pitch", "Good for batsmen", "Home to Sunrisers Hyderabad"],
    coordinates: { lat: 17.4065, lng: 78.5505 },
    facilities: ["Parking", "Food & Beverages", "Media Box", "Training Facilities"],
    established: 2003,
    homeTeams: ["Sunrisers Hyderabad", "Hyderabad"],
    postalCode: "500039"
  },
  {
    name: "Sawai Mansingh Stadium",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    capacity: 30000,
    attributes: ["Batting-friendly", "Good outfield", "Home to Rajasthan Royals"],
    coordinates: { lat: 26.8955, lng: 75.8069 },
    facilities: ["Parking", "Food & Beverages", "Media Box", "Training Facilities"],
    established: 1969,
    homeTeams: ["Rajasthan Royals", "Rajasthan"],
    postalCode: "302005"
  },
  {
    name: "Punjab Cricket Association IS Bindra Stadium",
    city: "Mohali",
    state: "Punjab",
    country: "India",
    capacity: 26000,
    attributes: ["Good pace and bounce", "Helpful for fast bowlers", "Home to Punjab Kings"],
    coordinates: { lat: 30.6868, lng: 76.7387 },
    facilities: ["Parking", "Food & Beverages", "Media Box", "Indoor Practice Facilities"],
    established: 1993,
    homeTeams: ["Punjab Kings", "Punjab"],
    postalCode: "160059"
  },
  {
    name: "BRSABV Ekana Cricket Stadium",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    capacity: 50000,
    attributes: ["Modern facilities", "New venue", "Home to Lucknow Super Giants"],
    coordinates: { lat: 26.7919, lng: 80.9482 },
    facilities: ["Parking", "Food & Beverages", "Media Box", "Modern Amenities"],
    established: 2017,
    homeTeams: ["Lucknow Super Giants", "Uttar Pradesh"],
    postalCode: "226010"
  },
  // Additional Indian Venues
  {
    name: "Brabourne Stadium",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    capacity: 20000,
    attributes: ["Historic venue", "Batting friendly"],
    coordinates: { lat: 18.9322, lng: 72.8264 },
    facilities: ["Parking", "Food & Beverages", "Media Facilities"],
    established: 1937,
    homeTeams: ["Mumbai", "Cricket Club of India"],
    postalCode: "400020"
  },
  {
    name: "Barabati Stadium",
    city: "Cuttack",
    state: "Odisha",
    country: "India",
    capacity: 45000,
    attributes: ["Balanced pitch", "Good for ODI matches"],
    coordinates: { lat: 20.4861, lng: 85.8792 },
    facilities: ["Parking", "Food Stalls", "Media Box"],
    established: 1958,
    homeTeams: ["Odisha"],
    postalCode: "753001"
  },
  {
    name: "Green Park Stadium",
    city: "Kanpur",
    state: "Uttar Pradesh",
    country: "India",
    capacity: 32000,
    attributes: ["Historic venue", "Slow and low pitch"],
    coordinates: { lat: 26.4850, lng: 80.3182 },
    facilities: ["Parking", "Basic Amenities", "Media Facilities"],
    established: 1945,
    homeTeams: ["Uttar Pradesh"],
    postalCode: "208005"
  },
  {
    name: "Holkar Cricket Stadium",
    city: "Indore",
    state: "Madhya Pradesh",
    country: "India",
    capacity: 30000,
    attributes: ["Batting-friendly", "High-scoring venue"],
    coordinates: { lat: 22.7180, lng: 75.8879 },
    facilities: ["Parking", "Food & Beverages", "Modern Amenities"],
    established: 2010,
    homeTeams: ["Madhya Pradesh"],
    postalCode: "452001"
  },
  {
    name: "Maharashtra Cricket Association Stadium",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    capacity: 37000,
    attributes: ["Modern stadium", "Balanced pitch"],
    coordinates: { lat: 18.6740, lng: 73.7058 },
    facilities: ["Parking", "Food Courts", "Premium Seating", "Media Facilities"],
    established: 2012,
    homeTeams: ["Maharashtra", "Pune"],
    postalCode: "411057"
  },
  {
    name: "Vidarbha Cricket Association Stadium",
    city: "Nagpur",
    state: "Maharashtra",
    country: "India",
    capacity: 45000,
    attributes: ["Spin-friendly", "Good for Test matches"],
    coordinates: { lat: 21.0152, lng: 79.0522 },
    facilities: ["Parking", "Food & Beverages", "Media Box"],
    established: 2008,
    homeTeams: ["Vidarbha"],
    postalCode: "440035"
  },
  {
    name: "JSCA International Stadium Complex",
    city: "Ranchi",
    state: "Jharkhand",
    country: "India",
    capacity: 39000,
    attributes: ["Modern facilities", "Balanced pitch"],
    coordinates: { lat: 23.3102, lng: 85.2778 },
    facilities: ["Parking", "Food Courts", "Tennis Courts", "Swimming Pool"],
    established: 2013,
    homeTeams: ["Jharkhand"],
    postalCode: "834002"
  },
  {
    name: "Himachal Pradesh Cricket Association Stadium",
    city: "Dharamshala",
    state: "Himachal Pradesh",
    country: "India",
    capacity: 23000,
    attributes: ["Scenic location", "Fast and bouncy pitch"],
    coordinates: { lat: 32.2050, lng: 76.3200 },
    facilities: ["Parking", "Food & Beverages", "Mountain Views"],
    established: 2003,
    homeTeams: ["Himachal Pradesh"],
    postalCode: "176215"
  },
  {
    name: "Saurashtra Cricket Association Stadium",
    city: "Rajkot",
    state: "Gujarat",
    country: "India",
    capacity: 28000,
    attributes: ["Batting-friendly", "Modern infrastructure"],
    coordinates: { lat: 22.3648, lng: 70.7538 },
    facilities: ["Parking", "Food & Beverages", "Media Box"],
    established: 2009,
    homeTeams: ["Saurashtra"],
    postalCode: "360005"
  },
  {
    name: "Barsapara Cricket Stadium",
    city: "Guwahati",
    state: "Assam",
    country: "India",
    capacity: 40000,
    attributes: ["New venue", "Modern facilities"],
    coordinates: { lat: 26.1141, lng: 91.7781 },
    facilities: ["Parking", "Food & Beverages", "Modern Amenities"],
    established: 2017,
    homeTeams: ["Assam"],
    postalCode: "781018"
  }
];

// World's major cricket venues
export const worldVenues: VenueData[] = [
  {
    name: "Lord's Cricket Ground",
    city: "London",
    country: "England",
    capacity: 30000,
    attributes: ["Home of Cricket", "Sloped outfield", "Historic venue"],
    coordinates: { lat: 51.5296, lng: -0.1728 },
    facilities: ["Parking", "Food & Beverages", "Museum", "Tours", "Media Centre"],
    established: 1814,
    homeTeams: ["England", "Middlesex"],
    postalCode: "NW8 8QN"
  },
  {
    name: "Melbourne Cricket Ground",
    city: "Melbourne",
    country: "Australia",
    capacity: 100024,
    attributes: ["Largest cricket stadium in Australia", "Boxing Day Test venue"],
    coordinates: { lat: -37.8200, lng: 144.9830 },
    facilities: ["Parking", "Food & Beverages", "Museum", "Tours"],
    established: 1853,
    homeTeams: ["Australia", "Victoria"],
    postalCode: "3002"
  },
  {
    name: "Sydney Cricket Ground",
    city: "Sydney",
    country: "Australia",
    capacity: 48000,
    attributes: ["Historic venue", "Spin-friendly pitch"],
    coordinates: { lat: -33.8914, lng: 151.2250 },
    facilities: ["Parking", "Food & Beverages", "Museum"],
    established: 1848,
    homeTeams: ["Australia", "New South Wales"],
    postalCode: "2021"
  },
  {
    name: "Adelaide Oval",
    city: "Adelaide",
    country: "Australia",
    capacity: 53583,
    attributes: ["Day-night Test venue", "Beautiful setting"],
    coordinates: { lat: -34.9155, lng: 138.5960 },
    facilities: ["Parking", "Food & Beverages", "Roof Climb Experience"],
    established: 1871,
    homeTeams: ["Australia", "South Australia"],
    postalCode: "5000"
  },
  {
    name: "The Oval",
    city: "London",
    country: "England",
    capacity: 25500,
    attributes: ["First ground to host Test cricket in England", "Batting-friendly"],
    coordinates: { lat: 51.4833, lng: -0.1150 },
    facilities: ["Parking", "Food & Beverages", "Conference Facilities"],
    established: 1845,
    homeTeams: ["England", "Surrey"],
    postalCode: "SE11 5SS"
  },
  {
    name: "Old Trafford",
    city: "Manchester",
    country: "England",
    capacity: 26000,
    attributes: ["Spin-friendly", "Windy conditions"],
    coordinates: { lat: 53.4631, lng: -2.2913 },
    facilities: ["Parking", "Food & Beverages", "Conference Facilities"],
    established: 1857,
    homeTeams: ["England", "Lancashire"],
    postalCode: "M16 0PX"
  },
  {
    name: "Newlands Cricket Ground",
    city: "Cape Town",
    country: "South Africa",
    capacity: 25000,
    attributes: ["Most beautiful cricket ground", "Mountain backdrop"],
    coordinates: { lat: -33.9747, lng: 18.4698 },
    facilities: ["Parking", "Food & Beverages", "Brewery", "Premium Facilities"],
    established: 1888,
    homeTeams: ["South Africa", "Cape Cobras"],
    postalCode: "7700"
  },
  {
    name: "Wanderers Stadium",
    city: "Johannesburg",
    country: "South Africa",
    capacity: 34000,
    attributes: ["Bullring", "Fast and bouncy track"],
    coordinates: { lat: -26.1267, lng: 28.0584 },
    facilities: ["Parking", "Food & Beverages", "Museum"],
    established: 1956,
    homeTeams: ["South Africa", "Lions"],
    postalCode: "2196"
  },
  {
    name: "Kensington Oval",
    city: "Bridgetown",
    country: "Barbados",
    capacity: 28000,
    attributes: ["Historic Caribbean venue", "Fast and bouncy track"],
    coordinates: { lat: 13.1278, lng: -59.6151 },
    facilities: ["Parking", "Food & Beverages", "Media Facilities"],
    established: 1871,
    homeTeams: ["West Indies", "Barbados"],
    postalCode: "BB11000"
  },
  {
    name: "Galle International Stadium",
    city: "Galle",
    country: "Sri Lanka",
    capacity: 35000,
    attributes: ["Spin paradise", "Fort backdrop", "Scenic location"],
    coordinates: { lat: 6.0328, lng: 80.2182 },
    facilities: ["Basic amenities", "Food Stalls", "Viewing Areas"],
    established: 1876,
    homeTeams: ["Sri Lanka"],
    postalCode: "80000"
  },
  {
    name: "Basin Reserve",
    city: "Wellington",
    country: "New Zealand",
    capacity: 11600,
    attributes: ["Windy conditions", "Round shape", "Historic venue"],
    coordinates: { lat: -41.2783, lng: 174.7792 },
    facilities: ["Parking", "Food & Beverages", "Museum"],
    established: 1868,
    homeTeams: ["New Zealand", "Wellington"],
    postalCode: "6011"
  },
  {
    name: "Eden Park",
    city: "Auckland",
    country: "New Zealand",
    capacity: 50000,
    attributes: ["Multi-purpose stadium", "Unique dimensions"],
    coordinates: { lat: -36.8747, lng: 174.7447 },
    facilities: ["Parking", "Food & Beverages", "Corporate Facilities"],
    established: 1900,
    homeTeams: ["New Zealand", "Auckland"],
    postalCode: "1024"
  },
  {
    name: "National Stadium",
    city: "Karachi",
    country: "Pakistan",
    capacity: 34228,
    attributes: ["Largest cricket stadium in Pakistan", "Batting-friendly"],
    coordinates: { lat: 24.9061, lng: 67.1309 },
    facilities: ["Parking", "Food & Beverages", "Media Box"],
    established: 1955,
    homeTeams: ["Pakistan", "Karachi Kings"],
    postalCode: "74800"
  },
  {
    name: "Gaddafi Stadium",
    city: "Lahore",
    country: "Pakistan",
    capacity: 27000,
    attributes: ["Historic venue", "Good batting pitch"],
    coordinates: { lat: 31.5046, lng: 74.3334 },
    facilities: ["Parking", "Food & Beverages", "Media Facilities"],
    established: 1959,
    homeTeams: ["Pakistan", "Lahore Qalandars"],
    postalCode: "54000"
  },
  {
    name: "Sher-e-Bangla National Cricket Stadium",
    city: "Dhaka",
    country: "Bangladesh",
    capacity: 25000,
    attributes: ["Main stadium of Bangladesh", "Spin-friendly"],
    coordinates: { lat: 23.7884, lng: 90.3654 },
    facilities: ["Parking", "Food & Beverages", "Media Box"],
    established: 2006,
    homeTeams: ["Bangladesh", "Dhaka Dynamites"],
    postalCode: "1207"
  }
];

// Combine all venues for easy access
export const allVenues: VenueData[] = [...indianVenues, ...worldVenues];