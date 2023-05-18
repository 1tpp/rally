import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import "../styles/Map.css";

import debounce from "lodash/debounce";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams, useNavigate } from "react-router-dom";

import MapPlaceholder from "../components/MapPlaceholder";
import SetViewOnClick from "../components/SetViewOnClick";
import RoutingControl from "../components/RoutingControl";
import WaypointList from "../components/WaypointList";
import DialogLayout from "../components/DialogLayout";
import WaypointListHeader from "../components/WaypointListHeader";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvent,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";

import {
  startIcon,
  endIcon,
  navigateIcon,
  restaurantIcon,
  cafeIcon,
  cinemaIcon,
  fuelIcon,
  hospitalIcon,
  marketplaceIcon,
  libraryIcon,
  collegeIcon,
  bankIcon,
  fastfoodIcon,
  hotelIcon,
  icecreamIcon,
  toiletsIcon,
  taxiIcon,
} from "../components/MarkerIcons";

import roadtripService from "../services/roadtripServices";
import favoriteServices from "../services/favoriteServices";
import landmarkServices from "../services/landmarkServices";

const initialRoadtrip = {
  id: null,
  title: "New Roadtrip",
  sub_title: "",
  description: "",
  waypoints: [],
  total_distance: null,
  total_time: null,
  distance_between_waypoints: [],
  category: "",
  summary: "",
};
function CreateMarkerOnClick({ saveMarkers }) {
  const map = useMapEvents({
    contextmenu: (e) => {
      const { lat, lng } = e.latlng;
      saveMarkers([lat, lng]);
    },
  });
  return null;
}

function MapPage() {
  const animateRef = useRef(true);
  const [elements, setElements] = useState([]);
  const [roadtrip, setRoadtrip] = useState(initialRoadtrip);
  const [showEditTitleDialog, setShowEditTitleDialog] = useState(false);
  const [roadtripDetailsForm, setRoadtripDetailsForm] =
    useState(initialRoadtrip);
  const [routeNavigating, setRouteNavigating] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [markers, setMarkers] = useState([]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const amenityTypes = [
    "restaurant",
    "cafe",
    "bar",
    "pub",
    "fast_food",
    "biergarten",
    "food_court",
    "cinema",
    "fuel",
    "hospital",
    "marketplace",
    "library",
    "college",
    "bank",
    "university",
    "ice_cream",
    "taxi",
    "school",
    "kindergarten",
    "atm",
    "toilets",
    "ice_cream",
  ];

  const searchElements = async ({ lat, lng }) => {
    const ApiUrl = `${import.meta.env.VITE_MAP_DATA_API}?data=[out:json];`;

    const radiusInMeters = 3000;
    const { data } = await axios.get(
      `${ApiUrl}node["amenity"~"${amenityTypes.join(
        "|"
      )}"](around:${radiusInMeters},${lat},${lng});out;`
    );

    const elementsTransformed = data.elements.map((element) => ({
      id: element.id.toString(),
      position: [element.lat, element.lon],
      name: element.tags.name || "No Name",
      amenity: element.tags.amenity.split("_").join(" ").toLocaleLowerCase(),
      opening_hours: element.tags.opening_hours || "N/A",
    }));

    setElements(elementsTransformed);
  };

  const LoadElements = () => {
    const map = useMapEvent(
      "moveend",
      debounce(() => {
        const { lat, lng } = map.getCenter();
        searchElements({ lat, lng });
      }, 300)
    );

    return null;
  };

  const handleAddFavorite = async (element) => {
    await favoriteServices
      .addFavorite(element)
      .then((res) => {
        const newFavorites = [...favorites, element];
        setFavorites(newFavorites);
        toast.success("Added to favorites");
      })
      .catch((err) => {
        toast.error("Failed to add to favorites");
      });
  };

  const handleRemoveFavorite = async (id) => {
    await favoriteServices
      .deleteFavorite(id)
      .then((res) => {
        const newFavorites = favorites.filter((n) => n.id !== id);
        setFavorites(newFavorites);
        toast.success("Removed from favorites");
      })
      .catch((err) => {
        toast.error("Failed to remove from favorites");
      });
  };

  const handleRouting = () => {
    setRouteNavigating(false);
    setTimeout(() => {
      setRouteNavigating(true);
    }, 1);
  };

  const handleUpdateWaypoint = (waypoints) => {
    setRoadtrip({
      ...roadtrip,
      waypoints: waypoints,
    });
    handleRouting();
  };

  const handleNewRouting = (newRoutingDetails) => {
    setRoadtrip({
      ...roadtrip,
      total_distance: newRoutingDetails.totalDistance,
      total_time: newRoutingDetails.totalTime,
      distance_between_waypoints: newRoutingDetails.distanceBetweenWaypoints,
    });
    toast.success("Auto-Saved", {
      autoClose: 500,
    });
  };

  const handleEditWaypoint = (waypoint) => {
    const newWaypoints = roadtrip.waypoints.map((n) => {
      if (n.id === waypoint.id) {
        return waypoint;
      } else {
        return n;
      }
    });
    setRoadtrip({
      ...roadtrip,
      waypoints: newWaypoints,
    });
    toast.success("Waypoint updated", {
      autoClose: 500,
    });
  };

  const addWaypointToRoute = (newWaypoint) => {
    handleUpdateWaypoint([...roadtrip.waypoints, newWaypoint]);
  };

  const removeWaypointFromRoute = (waypoint) => {
    handleUpdateWaypoint(
      roadtrip.waypoints.filter((n) => n.id !== waypoint.id)
    );

    setMarkers(markers.filter((n) => n.id !== waypoint.id));
  };

  const waypointNotExistsInRoute = (waypoint) => {
    return roadtrip.waypoints.find((n) => n.id === waypoint.id) === undefined;
  };

  const handleIcon = (element) => {
    const { waypoints } = roadtrip;

    const isFirstWaypoint = element.id === waypoints[0]?.id;
    const isLastWaypoint = element.id === waypoints[waypoints.length - 1]?.id;
    const isWaypointInRoute = !waypointNotExistsInRoute(element);

    if (isFirstWaypoint) return startIcon;
    if (isLastWaypoint) return endIcon;
    if (isWaypointInRoute) return navigateIcon;

    switch (element.amenity) {
      case "fuel":
        return fuelIcon;
      case "restaurant":
        return restaurantIcon;
      case "fast food":
        return fastfoodIcon;
      case "cafe":
        return cafeIcon;
      case "toilets":
        return toiletsIcon;
      case "hotel":
        return hotelIcon;
      case "hospital":
        return hospitalIcon;
      case "marketplace":
        return marketplaceIcon;
      case "library":
        return libraryIcon;
      case "cinema":
        return cinemaIcon;
      case "taxi":
        return taxiIcon;
      case "ice cream":
        return icecreamIcon;
      case "college":
      case "school":
      case "university":
      case "kindergarten":
        return collegeIcon;
      case "bank":
      case "atm":
        return bankIcon;
      default:
        return restaurantIcon;
    }
  };

  const handleStartNewTrip = async () => {
    await roadtripService
      .createRoadtrip(roadtrip)
      .then((res) => {
        setRoadtrip({
          ...roadtrip,
          id: res.roadtrip_id,
        });
        toast.success("New trip created");
      })
      .catch((err) => {
        toast.error("Failed to create trip");
      });
  };

  const handleUpdateTrip = async () => {
    await roadtripService
      .updateRoadtrip(roadtrip.id, roadtrip)
      .then((res) => {})
      .catch((err) => {
        toast.error("Failed to update trip");
      });
  };

  const handleClearTrip = () => {
    setRouteNavigating(false);
    setRoadtrip(initialRoadtrip);
    setMarkers([]);
    navigate("/map");
  };

  const getFavorites = async () => {
    await favoriteServices.getFavorites().then((res) => {
      setFavorites(res);
    });
  };

  const saveMarkers = (newMarkerCoordinates) => {
    const newMarker = {
      id: uuidv4(),
      position: newMarkerCoordinates,
      name: "Self Marker",
      amenity: "Location",
      opening_hours: "None",
      description: "",
      note: "",
    };

    const newMarkers = [...markers, newMarker];
    addWaypointToRoute(newMarker);
    setMarkers(newMarkers);
  };

  const handleAddMarker = (element) => {
    addWaypointToRoute(element);
    setMarkers([...markers, element]);
  };

  const handleEditRoadtripTitle = (newTitle) => {
    setRoadtrip({
      ...roadtrip,
      title: newTitle,
    });

    toast.success("Roadtrip title updated", {
      autoClose: 500,
    });
  };

  const handleLandmarkClick = async (element) => {
    await landmarkServices
      .getLandmark(element.id)
      .then((res) => {
        navigate(`/landmark/${element.id}`);
      })
      .catch(async (error) => {
        await landmarkServices.createLandmark(element);
        navigate(`/landmark/${element.id}`);
      });
  };

  useEffect(() => {
    if (searchParams.get("roadtrip") && roadtrip.id === null) {
      roadtripService
        .getRoadtrip(searchParams.get("roadtrip"))
        .then((res) => {
          setRoadtrip(res);
          setMarkers(res.waypoints);
          handleRouting();
        })
        .catch((err) => {
          toast.error("Failed to load trip");
        });
    }

    if (roadtrip.id !== null) {
      handleUpdateTrip();
    }

    if (roadtrip.waypoints.length > 0 && !roadtrip.id) {
      handleStartNewTrip();
    }

    if (roadtrip.waypoints.length === 0 && roadtrip.id) {
      roadtripService
        .deleteRoadtrip(roadtrip.id)
        .then((res) => {
          handleClearTrip();
          toast.info("Trip Cancelled");
        })
        .catch((err) => {
          toast.error("Failed to cancel trip");
        });
    }
  }, [roadtrip]);

  useEffect(() => {
    getFavorites();
  }, []);

  return (
    <div className="relative w-screen h-screen">
      {roadtrip.waypoints.length > 0 && (
        <>
          <div className="absolute bg-white z-20 w-[325px] left-2 top-40 max-h-[50vh] shadow-2xl overflow-x-hidden overflow-scroll h-full"></div>
          <div className="absolute z-20 w-[325px] left-2 top-40 max-h-[50vh] shadow-2xl overflow-x-hidden overflow-scroll scrollbar-hide h-full rounded-xl">
            <div className="relative w-full h-full">
              <WaypointListHeader
                totalDuration={roadtrip.total_time}
                totalDistance={roadtrip.total_distance}
                totalWaypoints={roadtrip.waypoints.length}
                handleClose={handleClearTrip}
              />
              <div className="relative pt-12 px-4 pb-4">
                <h1
                  className="text-3xl text-center mb-2 hover:underline hover:cursor-pointer"
                  onClick={() => {
                    setRoadtripDetailsForm(roadtrip);
                    setShowEditTitleDialog(true);
                  }}
                >
                  {roadtrip.title}
                </h1>
                {roadtrip.waypoints.length > 1 && (
                  <p className="items-center mb-4 text-md font-medium text-blue-500 text-center">
                    Total Distance:{" "}
                    {parseFloat(roadtrip.total_distance / 1000).toFixed(3)} km
                  </p>
                )}
                <WaypointList
                  onUpdateRoute={handleUpdateWaypoint}
                  distanceBetweenWaypoints={roadtrip.distance_between_waypoints}
                  waypoints={roadtrip.waypoints}
                  removeWaypointFromRoute={removeWaypointFromRoute}
                  onEditWaypoint={handleEditWaypoint}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {showEditTitleDialog && (
        <DialogLayout>
          <div className="flex flex-col p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium">Edit Roadtrip Details</h2>
              <button
                className="text-neutral-400 hover:text-neutral-500"
                onClick={() => setShowEditTitleDialog(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid px-4 space-y-2 border-b pb-8">
            <label className="text-sm font-medium text-neutral-400 mt-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={roadtripDetailsForm.title}
              onChange={(e) => {
                setRoadtripDetailsForm({
                  ...roadtripDetailsForm,
                  title: e.target.value,
                });
              }}
              className="border border-neutral-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end mt-8 p-4">
            <button
              className="bg-blue-400 text-white text-md font-medium rounded-full px-8 py-1 ml-2"
              onClick={() => {
                handleEditRoadtripTitle(roadtripDetailsForm.title);
                setShowEditTitleDialog(false);
              }}
            >
              Save
            </button>
          </div>
        </DialogLayout>
      )}

      <MapContainer
        className="z-10"
        center={[13.7294053, 100.7758304]}
        zoom={13}
        maxZoom={18}
        zoomControl={false}
        whenReady={() =>
          searchElements({
            lat: 13.7294053,
            lng: 100.7758304,
          })
        }
        scrollWheelZoom={true}
        placeholder={<MapPlaceholder />}
      >
        <TileLayer
          attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>'
          url={
            import.meta.env.VITE_MAPBOX_USERNAME &&
            import.meta.env.VITE_MAPBOX_STYLE &&
            import.meta.env.VITE_MAPBOX_TOKEN
              ? `https://api.mapbox.com/styles/v1/${
                  import.meta.env.VITE_MAPBOX_USERNAME
                }/${
                  import.meta.env.VITE_MAPBOX_STYLE
                }/tiles/256/{z}/{x}/{y}@2x?access_token=${
                  import.meta.env.VITE_MAPBOX_TOKEN
                }`
              : `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
          }
        />
        <SetViewOnClick animateRef={animateRef} />
        <CreateMarkerOnClick saveMarkers={saveMarkers} />

        <ZoomControl position="bottomright" />
        <LoadElements />

        {markers.length > 0 &&
          markers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={handleIcon(marker)}
              eventHandlers={{
                mouseover: (event) => event.target.openPopup(),
              }}
            >
              <Popup>
                <div className="flex flex-col flex-wrap space-y-1 justify-between min-w-[225px] font-sans">
                  <h1
                    className="text-2xl font-medium hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLandmarkClick({
                        id: marker.id,
                        name: marker.name,
                        position: marker.position,
                        opening_hours: marker.opening_hours,
                        amenity: marker.amenity,
                      });
                    }}
                  >
                    {marker.name}
                  </h1>
                  <div className="flex flex-wrap justify-between items-center pb-3">
                    <span className="text-yellow-400 bg-yellow-50 px-3 py-1 rounded-md capitalize">
                      {marker.amenity}
                    </span>
                    <time className="text-neutral-400">
                      {marker.opening_hours}
                    </time>
                  </div>

                  <div className="flex space-x-2 items-center">
                    {favorites.find((favorite) => favorite.id === marker.id) ? (
                      <button
                        onClick={() => {
                          handleRemoveFavorite(marker.id);
                        }}
                        className="flex items-center py-1 px-2 space-x-1 text-sm border bg-red-100 border-neutral-100 font-medium text-neutral-400 hover:text-neutral-500 rounded-md hover:animate-pulse hover:bg-red-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-6 h-6 text-red-500"
                        >
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleAddFavorite({
                            id: marker.id,
                            name: marker.name,
                            amenity: marker.amenity,
                            opening_hours: marker.opening_hours,
                            position: marker.position,
                          });
                        }}
                        className="flex items-center py-1 px-2 space-x-1 text-sm border border-neutral-100 font-medium text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 rounded-md"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                          />
                        </svg>
                      </button>
                    )}

                    {roadtrip.waypoints.length === 0 ? (
                      <button
                        className="text-green-400 w-full font-medium py-2 bg-green-50 px-3 rounded-md hover:bg-green-100 hover:ring-2 hover:ring-green-400 capitalize"
                        onClick={(e) => {
                          e.preventDefault();
                          addWaypointToRoute({
                            ...marker,
                            note: "",
                            description: "",
                          });
                          handleAddMarker({
                            ...marker,
                            note: "",
                            description: "",
                          });
                        }}
                      >
                        Start New Trip
                      </button>
                    ) : waypointNotExistsInRoute(marker) ? (
                      <button
                        className="text-blue-400 w-full font-medium py-2 bg-blue-50 px-3 rounded-md hover:bg-blue-100 hover:ring-2 hover:ring-blue-400 capitalize"
                        onClick={(e) => {
                          e.preventDefault();
                          addWaypointToRoute({
                            ...marker,
                            note: "",
                            description: "",
                          });
                          handleAddMarker({
                            ...marker,
                            note: "",
                            description: "",
                          });
                        }}
                      >
                        Add to trip
                      </button>
                    ) : (
                      <button
                        className="text-red-400 w-full font-medium py-2 bg-red-50 px-3 rounded-md hover:bg-red-100 hover:ring-2 hover:ring-red-400 capitalize"
                        onClick={(e) => {
                          e.preventDefault();
                          removeWaypointFromRoute(marker);
                        }}
                      >
                        Remove from trip
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {elements.length > 0 &&
          elements.map(
            (element) =>
              waypointNotExistsInRoute(element) && (
                <Marker
                  key={element.id}
                  position={element.position}
                  icon={handleIcon(element)}
                  eventHandlers={{
                    mouseover: (event) => event.target.openPopup(),
                  }}
                >
                  <Popup>
                    <div className="flex flex-col flex-wrap space-y-1 justify-between min-w-[225px] font-sans">
                      <h1
                        className="text-2xl font-medium hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLandmarkClick(element);
                        }}
                      >
                        {element.name}
                      </h1>
                      <div className="flex flex-wrap justify-between items-center pb-3">
                        <span className="text-yellow-400 bg-yellow-50 px-3 py-1 rounded-md capitalize">
                          {element.amenity}
                        </span>
                        <time className="text-neutral-400">
                          {element.opening_hours}
                        </time>
                      </div>

                      <div className="flex space-x-2 items-center">
                        {favorites.find(
                          (favorite) => favorite.id === element.id
                        ) ? (
                          <button
                            onClick={() => {
                              handleRemoveFavorite(element.id);
                            }}
                            className="flex items-center py-1 px-2 space-x-1 text-sm border bg-red-100 border-neutral-100 font-medium text-neutral-400 hover:text-neutral-500 rounded-md hover:animate-pulse hover:bg-red-200"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-6 h-6 text-red-500"
                            >
                              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              handleAddFavorite(element);
                            }}
                            className="flex items-center py-1 px-2 space-x-1 text-sm border border-neutral-100 font-medium text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 rounded-md"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                              />
                            </svg>
                          </button>
                        )}

                        {roadtrip.waypoints.length === 0 ? (
                          <button
                            className="text-green-400 w-full font-medium py-2 bg-green-50 px-3 rounded-md hover:bg-green-100 hover:ring-2 hover:ring-green-400 capitalize"
                            onClick={(e) => {
                              e.preventDefault();
                              addWaypointToRoute({
                                ...element,
                                note: "",
                                description: "",
                              });
                              handleAddMarker({
                                ...element,
                                note: "",
                                description: "",
                              });
                            }}
                          >
                            Start New Trip
                          </button>
                        ) : waypointNotExistsInRoute(element) ? (
                          <button
                            className="text-blue-400 w-full font-medium py-2 bg-blue-50 px-3 rounded-md hover:bg-blue-100 hover:ring-2 hover:ring-blue-400 capitalize"
                            onClick={(e) => {
                              e.preventDefault();
                              addWaypointToRoute({
                                ...element,
                                note: "",
                                description: "",
                              });
                              handleAddMarker({
                                ...element,
                                note: "",
                                description: "",
                              });
                            }}
                          >
                            Add to trip
                          </button>
                        ) : (
                          <button
                            className="text-red-400 w-full font-medium py-2 bg-red-50 px-3 rounded-md hover:bg-red-100 hover:ring-2 hover:ring-red-400 capitalize"
                            onClick={(e) => {
                              e.preventDefault();
                              removeWaypointFromRoute(element);
                            }}
                          >
                            Remove from trip
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
          )}

        {routeNavigating && (
          <RoutingControl
            position="bottomright"
            color="#856be3"
            waypoints={roadtrip.waypoints.map((waypoint) => waypoint.position)}
            onRouting={handleNewRouting}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MapPage;
