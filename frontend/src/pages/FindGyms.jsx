/**
 * Location-based gym finder using the Google Maps API
 * Users can search for gyms near a specified location
 * Displays gym details like name, address, rating, and open status
 */

import React, { useState, useRef, useCallback} from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';

/**
 * Tells google maps to load the places library for location search
 * Places library provides location search, autocomplete, and place details
 */
const libraries = ['places'];

/**
 * Defines the size of the map container
 */
const mapContainerStyle = {
  height: '600px',
  width: '100%'
};

/**
 * Defaults to SF until user searches for a location or asks to use theirs
 */
const defaultCenter = {
  lat: 37.7749, 
  lng: -122.4194
};

/**
 * disableDefaultUI keeps the default controls off the map for a cleaner look
 * zoomControl allows user to zoom in/out
 * streetViewControl allows user to toggle street view
 * mapTypeControl allows user to change map type (satellite, terrain, etc)
 * fullScreenControl allows user to enter full screen mode
 */
const options = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: false,
    fullScreenControl: true
}

export default function FindGyms() {
    //Loads Google Maps Javascript from Google's servers
    const {isLoaded, loadError} = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries
    });

    // The user's GPS coordinates after they allow location access
    const [userLocation, setUserLocation] = useState(null);

    // The list of gyms fetched from Google Places API
    const [gyms, setGyms] = useState([]);

    // The gym currently selected by the user (for InfoWindow)
    const [selectedGym, setSelectedGym] = useState(null);

    // Where the map is centered
    const [mapCenter, setMapCenter] = useState(defaultCenter);

    // How far to search for gyms
    const [searchRadius, setSearchRadius] = useState(5000); // in meters

    // Whether a search is in progress
    const [isSearching, setIsSearching] = useState(false);

    // Creates a reference to the map instance
    const mapRef = useRef();

    // Callback function to handle map load
    // Without callback, mapRef would reset on every render causing issues
    // With callback, mapRef is stable and only set once when map loads
    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    // navigator.geolocation is a browser API which asks users for permission to access their GPS location
    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                    setUserLocation(userPos);
                    setMapCenter(userPos);
                    searchNearbyGyms(userPos);
                }, 
                (error) => {
                    console.error("Error getting location: ", error);
                    alert("Couldn't get your location. Please enable location services.");
                }
            );
        }
        else {
            alert('Geolocation is not supported by your browser');
        }
    };

    const searchNearbyGyms = (location) => {
        // Checks if the map is loaded and ready, can't search for places without a map instance
        if (!mapRef.current) {
            return;
        }

        setIsSearching(true);

        /**
         * window is the global browser object which contains everything available in the browser
         * window.google is google's javascript library added to window when google maps script loads
         * "new" creates a new instance of hte PlacesService class
         * We are passing in the map instance we saved earlier
         * PlacesService uses the map to display results and calculate distances
         */
        const service = new window.google.maps.places.PlacesService(mapRef.current);

        /**
         * This is the object that tells Google what to search for
         * location is the center point of search
         * searchRadius is how far to search
         * gym is what type of place to search for
         * "fitness gym workout" is additional terms to refine the results
         */
        const request = {
            location: location, 
            radius: searchRadius,
            type: 'gym',
            keyword: 'fitness gym workout'
        };

        /**
         * This function makes an api call to google's servers to find places
         * request is the search config we just built
         * (results, status) is the callback function that runs when results come back
         * Callback is required because the api call takes time
         */
        service.nearbySearch(request, (results, status) => {
            setIsSearching(false);

            //this is an ENUM and the set of constants are OK, ZERO_RESULTS, OVER_QUERY_LIMIT, REQUEST_DENIED, INVALID_REQUEST, UNKNOWN_ERROR
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                console.log(`Found ${results.length} gyms nearby`);
                setGyms(results)
            }
            else {
                alert('Could not find gyms nearby. Try adjusting the search radius');
            }
        });

    }


    /**
     * Getting the details of the specific gym that was clicked on
     * @param {*} gym The gym object from the nearbySearch results
     */
    const getGymDetails = (gym) => {
        // Can't make API calls without the map instance
        if (!mapRef.current) {
            return;
        }

        const service = new window.google.maps.places.PlacesService(mapRef.current);

        service.getDetails(
            {
                // A unique identifier for every place in Google's database
                placeId: gym.place_id,
                // Array of which fields you want to be returned, better to be specified as Google charges based on which fields you request
                fields: ['name', 'rating', 'formatted_phone_number', 'opening_hours', 'website', 'formatted_address', 'photos']
            },
            (place, status) => {
                // If the request succeeded, we got the detailed info
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    // Copies all properties from the gym object and we spread it because we want to keep the original gym data and add new details
                    setSelectedGym({ ...gym, details: place });
                }
            }
        );
    };


    /**
     * Loading state
     */
    if (loadError) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Error loading Google Maps
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="text-center py-12">
                    <div className="text-xl text-gray-600">Loading maps...</div>
                </div>
            </div>
        );
    }

    /**
     * Main render
     */
    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    Find Gyms Near You
                </h1>
                <p className="text-gray-600">
                    Discover fitness centers and gyms in your area
                </p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    {/* Get Location Button */}
                    <div className="flex-1 min-w-[200px]">
                        <button
                            onClick={getUserLocation}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Use My Location
                        </button>
                    </div>

                    {/* Search Radius */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Radius
                        </label>
                        <select
                            value={searchRadius}
                            onChange={(e) => setSearchRadius(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value={1000}>1 km</option>
                            <option value={2000}>2 km</option>
                            <option value={5000}>5 km</option>
                            <option value={10000}>10 km</option>
                            <option value={25000}>25 km</option>
                        </select>
                    </div>

                    {/* Search Button */}
                    <div className="flex-1 min-w-[200px]">
                        <button
                            onClick={() => searchNearbyGyms(userLocation || mapCenter)}
                            disabled={isSearching}
                            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSearching ? 'Searching...' : `Search (${gyms.length} found)`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Map and Results */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            zoom={13}
                            center={mapCenter}
                            options={options}
                            onLoad={onMapLoad}
                        >
                            {/* User location marker */}
                            {userLocation && (
                                <Marker
                                    position={userLocation}
                                    icon={{
                                        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                                    }}
                                />
                            )}

                            {/* Gym markers */}
                            {gyms.map((gym) => (
                                <Marker
                                    key={gym.place_id}
                                    position={{
                                        lat: gym.geometry.location.lat(),
                                        lng: gym.geometry.location.lng()
                                    }}
                                    onClick={() => getGymDetails(gym)}
                                    icon={{
                                        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                                    }}
                                />
                            ))}

                            {/* Info window for selected gym */}
                            {selectedGym && (
                                <InfoWindow
                                    position={{
                                        lat: selectedGym.geometry.location.lat(),
                                        lng: selectedGym.geometry.location.lng()
                                    }}
                                    onCloseClick={() => setSelectedGym(null)}
                                >
                                    <div className="p-2 max-w-xs">
                                        <h3 className="font-bold text-lg mb-1">
                                            {selectedGym.name}
                                        </h3>
                                        {selectedGym.rating && (
                                            <div className="flex items-center gap-1 mb-2">
                                                <span className="text-yellow-500">⭐</span>
                                                <span className="font-medium">{selectedGym.rating}</span>
                                                <span className="text-gray-500 text-sm">
                                                    ({selectedGym.user_ratings_total} reviews)
                                                </span>
                                            </div>
                                        )}
                                        {selectedGym.details?.formatted_address && (
                                            <p className="text-sm text-gray-600 mb-2">
                                                📍 {selectedGym.details.formatted_address}
                                            </p>
                                        )}
                                        {selectedGym.details?.formatted_phone_number && (
                                            <p className="text-sm text-gray-600 mb-2">
                                                📞 {selectedGym.details.formatted_phone_number}
                                            </p>
                                        )}
                                        {selectedGym.details?.website && (
                                            <a
                                                href={selectedGym.details.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                Visit Website →
                                            </a>
                                        )}
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    </div>
                </div>

                {/* Gym List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-h-[600px] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            Nearby Gyms ({gyms.length})
                        </h2>

                        {gyms.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="mb-2">No gyms found</p>
                                <p className="text-sm">Click "Use My Location" to search</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {gyms.map((gym) => (
                                    <div
                                        key={gym.place_id}
                                        onClick={() => {
                                            getGymDetails(gym);
                                            setMapCenter({
                                                lat: gym.geometry.location.lat(),
                                                lng: gym.geometry.location.lng()
                                            });
                                        }}
                                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition"
                                    >
                                        <h3 className="font-semibold text-lg mb-1">
                                            {gym.name}
                                        </h3>
                                        {gym.rating && (
                                            <div className="flex items-center gap-1 mb-2">
                                                <span className="text-yellow-500">⭐</span>
                                                <span className="text-sm">{gym.rating}</span>
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-600">
                                            {gym.vicinity}
                                        </p>
                                        {gym.opening_hours && (
                                            <p className="text-sm mt-2">
                                                {gym.opening_hours.open_now ? (
                                                    <span className="text-green-600 font-medium">
                                                        🟢 Open Now
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600 font-medium">
                                                        🔴 Closed
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )


}
