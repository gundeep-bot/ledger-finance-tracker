const axios = require('axios');

/**
 * BookMyShow Event Fetcher Service
 * Fetches live events from BookMyShow-style sources
 * Uses TMDB API as primary source (free, reliable)
 */

// TMDB API for movies/events (free API key available at https://www.themoviedb.org/settings/api)
const TMDB_API_KEY = process.env.TMDB_API_KEY || '1f54bd990f1cdfb2adb9aad825432c95'; // Public demo key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Fetch events from TMDB API (movies as events)
 * This is a reliable, free alternative to BookMyShow scraping
 */
const fetchTMDBEvents = async (city = 'Mumbai', limit = 20) => {
  try {
    // Fetch upcoming movies (which can be treated as events)
    const response = await axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1,
        region: 'IN'
      },
      timeout: 10000
    });

    const movies = response.data.results || [];
    
    // Also fetch now playing movies (some might still be upcoming in different regions)
    let nowPlaying = [];
    try {
      const nowPlayingResponse = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          page: 1,
          region: 'IN'
        },
        timeout: 10000
      });
      nowPlaying = nowPlayingResponse.data.results || [];
    } catch (err) {
      console.log('Now playing fetch failed, continuing with upcoming only');
    }

    const allMovies = [...new Set([...movies, ...nowPlaying].map(m => m.id))].map(id => 
      [...movies, ...nowPlaying].find(m => m.id === id)
    );
    
    // Filter to only upcoming events (future dates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingMovies = allMovies
      .filter(movie => {
        if (!movie.release_date) return false;
        const releaseDate = new Date(movie.release_date);
        releaseDate.setHours(0, 0, 0, 0);
        // Include movies released today or in the future
        return releaseDate >= today;
      })
      .slice(0, limit);
    
    return upcomingMovies.map((movie) => {
      // Generate realistic prices based on movie popularity
      const basePrice = 200;
      const popularityMultiplier = Math.floor((movie.vote_average || 5) * 50);
      const price = basePrice + popularityMultiplier;
      
      // Use release date as event date (already future date)
      const releaseDate = new Date(movie.release_date);
      const eventDate = new Date(releaseDate);
      // Add some days to make it more realistic (events happen after movie release)
      eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days after release
      eventDate.setHours(18, 0, 0, 0); // 6 PM default time
      
      return {
        title: movie.title || movie.original_title,
        imageUrl: movie.poster_path 
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : movie.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
          : `https://picsum.photos/seed/${(movie.title || 'movie').replace(/\s+/g, '')}/500/750`,
        description: movie.overview || `${movie.title} - Experience the magic!`,
        price: Math.max(price, 200), // Minimum price 200
        venue: `${city} Cinema Hall`,
        location: city, // Add location explicitly
        date: eventDate.toISOString(),
        category: 'Entertainment',
        source: 'tmdb',
        externalId: `tmdb_${movie.id}`,
        popularity: movie.popularity || 0,
        rating: movie.vote_average || 0
      };
    });
  } catch (error) {
    console.error('Error fetching TMDB events:', error.message);
    return [];
  }
};

// List of major Indian cities across different states
const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna',
  'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
  'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Amritsar', 'Chandigarh',
  'Kochi', 'Goa', 'Trivandrum', 'Mysore', 'Coimbatore', 'Guwahati',
  'Bhubaneswar', 'Dehradun', 'Ranchi', 'Raipur', 'Jodhpur', 'Udaipur'
];

/**
 * Fetch events from BookMyShow-style sources dynamically
 * Combines movies from TMDB with other event types (stand-up, concerts, sports, etc.)
 * Distributes events across multiple Indian cities
 * This runs fresh each time to simulate dynamic BookMyShow fetching
 */
const fetchBookMyShowStyleEvents = async (city = null, limit = 50) => {
  const allEvents = [];
  
  // If no specific city, fetch events from multiple cities
  const citiesToUse = city ? [city] : INDIAN_CITIES;
  const eventsPerCity = Math.ceil(limit / citiesToUse.length);
  
  // Fetch events from multiple cities
  for (const currentCity of citiesToUse.slice(0, Math.min(10, citiesToUse.length))) {
    try {
      // Try to fetch movies from TMDB for this city
      const movieEvents = await fetchTMDBEvents(currentCity, Math.min(5, eventsPerCity));
      if (movieEvents.length > 0) {
        allEvents.push(...movieEvents);
      }
    } catch (error) {
      console.log(`TMDB fetch failed for ${currentCity}, using generated events`);
    }
    
    // Generate diverse event types for this city
    const cityEvents = generateMockBookMyShowEvents(currentCity, eventsPerCity);
    allEvents.push(...cityEvents);
  }
  
  // Shuffle events to simulate dynamic BookMyShow ordering
  const shuffled = allEvents.sort(() => Math.random() - 0.5);
  
  // Filter to only upcoming events and limit results
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingEvents = shuffled
    .filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .slice(0, limit);
  
  // Sort by date (earliest first)
  upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return upcomingEvents;
};

/**
 * Generate comprehensive BookMyShow-style events (movies, stand-up, concerts, sports, etc.)
 */
const generateMockBookMyShowEvents = (city, limit) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const allEvents = [
    // Movies
    { title: 'Avengers: Endgame', basePrice: 350, category: 'Entertainment', venue: `${city} Multiplex`, imageQuery: 'movie,avengers' },
    { title: 'Spider-Man: No Way Home', basePrice: 300, category: 'Entertainment', venue: `${city} Cinema`, imageQuery: 'movie,spiderman' },
    { title: 'Dune', basePrice: 400, category: 'Entertainment', venue: `${city} PVR`, imageQuery: 'movie,dune' },
    { title: 'Top Gun: Maverick', basePrice: 380, category: 'Entertainment', venue: `${city} IMAX`, imageQuery: 'movie,topgun' },
    { title: 'The Batman', basePrice: 350, category: 'Entertainment', venue: `${city} Cineplex`, imageQuery: 'movie,batman' },
    { title: 'Black Panther', basePrice: 320, category: 'Entertainment', venue: `${city} Multiplex`, imageQuery: 'movie,blackpanther' },
    { title: 'Avatar: The Way of Water', basePrice: 450, category: 'Entertainment', venue: `${city} IMAX`, imageQuery: 'movie,avatar' },
    { title: 'Oppenheimer', basePrice: 400, category: 'Entertainment', venue: `${city} PVR`, imageQuery: 'movie,oppenheimer' },
    
    // Stand-up Comedy
    { title: 'Vir Das Live Stand-up Comedy', basePrice: 500, category: 'Entertainment', venue: `${city} Comedy Club`, imageQuery: 'comedy,standup' },
    { title: 'Zakir Khan: Haq Se Single', basePrice: 600, category: 'Entertainment', venue: `${city} Auditorium`, imageQuery: 'comedy,standup' },
    { title: 'Biswa Kalyan Rath Live', basePrice: 550, category: 'Entertainment', venue: `${city} Comedy Club`, imageQuery: 'comedy,standup' },
    { title: 'Rohan Joshi Stand-up Show', basePrice: 450, category: 'Entertainment', venue: `${city} Theatre`, imageQuery: 'comedy,standup' },
    { title: 'Kenny Sebastian Live', basePrice: 500, category: 'Entertainment', venue: `${city} Comedy Club`, imageQuery: 'comedy,standup' },
    { title: 'Aakash Gupta Stand-up Comedy', basePrice: 400, category: 'Entertainment', venue: `${city} Auditorium`, imageQuery: 'comedy,standup' },
    
    // Concerts
    { title: 'Arijit Singh Live Concert', basePrice: 1500, category: 'Music', venue: `${city} Arena`, imageQuery: 'concert,music' },
    { title: 'A.R. Rahman Musical Evening', basePrice: 2000, category: 'Music', venue: `${city} Stadium`, imageQuery: 'concert,music' },
    { title: 'Sunidhi Chauhan Live', basePrice: 1200, category: 'Music', venue: `${city} Arena`, imageQuery: 'concert,music' },
    { title: 'Shreya Ghoshal Concert', basePrice: 1300, category: 'Music', venue: `${city} Auditorium`, imageQuery: 'concert,music' },
    { title: 'Atif Aslam Live Performance', basePrice: 1800, category: 'Music', venue: `${city} Stadium`, imageQuery: 'concert,music' },
    { title: 'Rock Band Festival', basePrice: 800, category: 'Music', venue: `${city} Ground`, imageQuery: 'concert,rock' },
    
    // Sports
    { title: 'IPL Cricket Match', basePrice: 1000, category: 'Sports', venue: `${city} Stadium`, imageQuery: 'sports,cricket' },
    { title: 'Football Championship', basePrice: 600, category: 'Sports', venue: `${city} Sports Complex`, imageQuery: 'sports,football' },
    { title: 'Badminton Tournament', basePrice: 400, category: 'Sports', venue: `${city} Indoor Stadium`, imageQuery: 'sports,badminton' },
    { title: 'Marathon Run 2024', basePrice: 500, category: 'Sports', venue: `${city} Race Track`, imageQuery: 'sports,marathon' },
    
    // Theatre & Arts
    { title: 'Shakespeare Play: Hamlet', basePrice: 700, category: 'Art', venue: `${city} Theatre`, imageQuery: 'theatre,shakespeare' },
    { title: 'Bollywood Dance Show', basePrice: 500, category: 'Art', venue: `${city} Auditorium`, imageQuery: 'dance,bollywood' },
    { title: 'Classical Music Evening', basePrice: 600, category: 'Art', venue: `${city} Cultural Centre`, imageQuery: 'music,classical' },
    
    // Food & Business
    { title: 'Food Festival 2024', basePrice: 300, category: 'Food', venue: `${city} Ground`, imageQuery: 'food,festival' },
    { title: 'Wine Tasting Event', basePrice: 800, category: 'Food', venue: `${city} Hotel`, imageQuery: 'food,wine' },
    { title: 'Startup Summit', basePrice: 2000, category: 'Business', venue: `${city} Convention Centre`, imageQuery: 'business,summit' },
    { title: 'Tech Conference 2024', basePrice: 1500, category: 'Business', venue: `${city} IT Park`, imageQuery: 'technology,conference' }
  ];

  // Shuffle and select events
  const shuffled = allEvents.sort(() => Math.random() - 0.5);
  const selectedEvents = shuffled.slice(0, Math.min(limit, allEvents.length));
  
  return selectedEvents.map((event, index) => {
    // Generate dates spread over next 30 days (more realistic and dynamic)
    const daysOffset = Math.floor(Math.random() * 30) + 1;
    const eventDate = new Date();
    eventDate.setDate(today.getDate() + daysOffset);
    
    // Randomize time between 10 AM and 10 PM
    const hour = Math.floor(Math.random() * 12) + 10; // 10-21
    const minute = Math.random() > 0.5 ? 0 : 30;
    eventDate.setHours(hour, minute, 0, 0);
    
    // Ensure date is in the future
    if (eventDate < today) {
      eventDate.setDate(today.getDate() + daysOffset);
    }
    
    // Use better image URLs with specific seed for consistency per event
    const imageSeed = event.title.replace(/\s+/g, '').toLowerCase() + event.category.toLowerCase();
    const imageUrl = `https://picsum.photos/seed/${imageSeed}/500/750`;
    
    return {
      title: event.title,
      imageUrl: imageUrl,
      description: `${event.title} - Experience the ultimate ${event.category.toLowerCase()} event! Book your tickets now.`,
      price: event.basePrice + Math.floor(Math.random() * 200),
      venue: event.venue,
      location: city, // Add location explicitly
      date: eventDate.toISOString(),
      category: event.category,
      source: 'bookmyshow',
      externalId: `bookmyshow_${imageSeed}_${Date.now()}_${index}`
    };
  });
};

/**
 * Fetch events using a combination of sources
 */
const fetchLiveEvents = async (options = {}) => {
  const {
    city = null, // null means fetch from all cities
    limit = 50,
    source = 'auto' // 'bookmyshow', 'tmdb', or 'auto'
  } = options;

  try {
    if (source === 'bookmyshow' || source === 'auto') {
      return await fetchBookMyShowStyleEvents(city, limit);
    } else if (source === 'tmdb') {
      return await fetchTMDBEvents(city || 'Mumbai', limit);
    }
    return [];
  } catch (error) {
    console.error('Error fetching live events:', error.message);
    return [];
  }
};

/**
 * Extract price from string
 */
const extractPrice = (priceStr) => {
  if (!priceStr) return 300; // Default price
  
  const match = priceStr.match(/₹?(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  return 300;
};

/**
 * Sync BookMyShow events to database
 */
const syncEventsToDatabase = async (Event, events, defaultOrganizerId = null) => {
  const syncedEvents = [];
  
  for (const eventData of events) {
    try {
      // Check if event already exists by externalId or title
      const existingEvent = await Event.findOne({ 
        $or: [
          { externalId: eventData.externalId },
          { title: eventData.title, source: eventData.source || 'bookmyshow' }
        ]
      });

      if (existingEvent) {
        // Update existing event
        existingEvent.imageUrl = eventData.imageUrl || existingEvent.imageUrl;
        existingEvent.price = eventData.price || existingEvent.price;
        existingEvent.availableSeats = existingEvent.totalSeats - existingEvent.bookings;
        await existingEvent.save();
        syncedEvents.push(existingEvent);
      } else {
        // Get default organizer (first admin user or create a system user)
        let organizerId = defaultOrganizerId;
        if (!organizerId) {
          const User = require('../models/User');
          const adminUser = await User.findOne({ role: 'admin' });
          if (adminUser) {
            organizerId = adminUser._id;
          } else {
            // Try to find any user with organizer role
            const organizerUser = await User.findOne({ role: 'organizer' });
            if (organizerUser) {
              organizerId = organizerUser._id;
            } else {
              // Try to find any user
              const anyUser = await User.findOne();
              if (anyUser) {
                organizerId = anyUser._id;
              } else {
                // Create a system organizer for external events
                try {
                  const bcrypt = require('bcryptjs');
                  const systemUser = await User.create({
                    name: 'System Organizer',
                    email: 'system@eventora.com',
                    password: await bcrypt.hash('system123', 10),
                    role: 'organizer',
                    isVerified: true
                  });
                  organizerId = systemUser._id;
                  console.log('Created system organizer for external events');
                } catch (createError) {
                  // If creation fails, try to find existing system user
                  const systemUser = await User.findOne({ email: 'system@eventora.com' });
                  if (systemUser) {
                    organizerId = systemUser._id;
                  } else {
                    console.error(`Failed to create/find organizer for event ${eventData.title}:`, createError.message);
                    continue;
                  }
                }
              }
            }
          }
        }

        // Extract location from venue or use a default
        let eventLocation = 'Mumbai';
        if (eventData.venue) {
          // Try to extract city from venue (e.g., "Mumbai Cinema" -> "Mumbai")
          const cityMatch = INDIAN_CITIES.find(city => 
            eventData.venue.toLowerCase().includes(city.toLowerCase())
          );
          if (cityMatch) {
            eventLocation = cityMatch;
          } else {
            // Try to get first word as city
            const firstWord = eventData.venue.split(' ')[0];
            if (firstWord) {
              eventLocation = firstWord;
            }
          }
        }
        // If location is provided directly, use it
        if (eventData.location) {
          eventLocation = eventData.location;
        }
        
        // Create new event
        const newEvent = await Event.create({
          title: eventData.title,
          description: eventData.description || `${eventData.title} - Book Now!`,
          category: eventData.category || 'Entertainment',
          date: new Date(eventData.date || Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          time: '18:00',
          location: eventLocation,
          venue: eventData.venue || `${eventLocation} Cinema Hall`,
          price: eventData.price || 300,
          totalSeats: 100,
          availableSeats: 100,
          imageUrl: eventData.imageUrl || '',
          organizer: organizerId,
          featured: false,
          source: eventData.source || 'bookmyshow',
          externalId: eventData.externalId || null,
          seatLayout: {
            rows: 10,
            seatsPerRow: 12,
            layout: 'standard',
            bookedSeats: [],
            seatCategories: {}
          }
        });
        syncedEvents.push(newEvent);
      }
    } catch (error) {
      console.error(`Error syncing event ${eventData.title}:`, error.message);
    }
  }

  return syncedEvents;
};

module.exports = {
  fetchBookMyShowStyleEvents,
  fetchTMDBEvents,
  fetchLiveEvents,
  syncEventsToDatabase,
  extractPrice
};

