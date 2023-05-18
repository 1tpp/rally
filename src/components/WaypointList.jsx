import React, { useRef, useState } from "react";
import Waypoint from "./Waypoint";
import DialogLayout from "./DialogLayout";

export default function WaypointList({
  waypoints,
  distanceBetweenWaypoints,
  onUpdateRoute,
  removeWaypointFromRoute,
  onEditWaypoint,
}) {
  const [showEditWaypointDialog, setShowEditWaypointDialog] = useState(false);
  const [waypointDetailsForm, setWaypointDetailsForm] = useState({
    name: "",
    amenity: "",
    position: [],
    opening_hours: "",
    note: "",
    description: "",
  });
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleSort = (e) => {
    e.preventDefault();
    const dragIndex = dragItem.current;
    const overIndex = dragOverItem.current;

    waypoints.splice(overIndex, 0, waypoints.splice(dragIndex, 1)[0]);
    dragItem.current = overIndex;

    onUpdateRoute(waypoints);
  };

  const handleShowEditWaypointDialog = (waypoint) => {
    setWaypointDetailsForm(waypoint);
    setShowEditWaypointDialog(true);
  };

  return (
    <>
      <ul className="flex flex-col list-none z-20">
        {waypoints.map((waypoint, index) => (
          <li
            className="cursor-grab active:cursor-grabbing"
            key={waypoint.id}
            draggable
            onDragStart={(e) => {
              dragItem.current = index;
            }}
            onDragEnter={(e) => {
              dragOverItem.current = index;
            }}
            onDragEnd={handleSort}
            onDragOver={(e) => {
              e.preventDefault();
            }}
          >
            <Waypoint
              waypoint={waypoint}
              index={index}
              totalOfWaypoint={waypoints.length}
              removeWaypointFromRoute={removeWaypointFromRoute}
              onEditWaypoint={handleShowEditWaypointDialog}
            />
            <>
              {waypoints.length > 1 && waypoints.length - 1 !== index && (
                <div className="flex items-center my-2">
                  <div className="border-b w-full border-neutral-200"></div>
                  <span className="w-36 ml-5 font-medium text-neutral-500 text-right">
                    {distanceBetweenWaypoints[index]
                      ? `${parseFloat(
                          distanceBetweenWaypoints[index] / 1000
                        ).toFixed(3)} km`
                      : "calculating..."}
                  </span>
                </div>
              )}
            </>
          </li>
        ))}
      </ul>

      {showEditWaypointDialog && (
        <DialogLayout>
          <div className="flex flex-col p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium">Edit Waypoint Details</h2>
              <button
                className="text-neutral-400 hover:text-neutral-500"
                onClick={() => setShowEditWaypointDialog(false)}
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

          <div className="grid grid-cols-2 px-4 space-y-2 border-b pb-8">
            <div>
              <label className="text-sm font-medium text-neutral-400">
                Name
              </label>
              <p className="text-lg font-medium">{waypointDetailsForm.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-400 mt-2">
                Amenity
              </label>
              <p className="text-lg font-medium capitalize">
                {waypointDetailsForm.amenity}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-400 mt-2">
                Opening Hours
              </label>
              <p className="text-lg font-medium">
                {waypointDetailsForm.opening_hours}
              </p>
            </div>
          </div>

          <div className="flex flex-col px-4 space-y-2 mt-8">
            <label className="text-sm font-medium text-neutral-400 mt-2">
              Note
            </label>
            <input
              type="text"
              className="rounded-md p-2 border border-neutral-300 focus:outline-none focus:border-blue-400"
              placeholder="Click to add a note"
              value={waypointDetailsForm.note}
              onChange={(e) => {
                e.preventDefault();
                setWaypointDetailsForm({
                  ...waypointDetailsForm,
                  note: e.target.value,
                });
              }}
            />
          </div>

          <div className="flex justify-between mt-32 p-4">
            <button
              className="text-red-400 text-md font-medium px-4 py-2 underline"
              onClick={(e) => {
                e.preventDefault();
                removeWaypointFromRoute(waypointDetailsForm);
                setShowEditWaypointDialog(false);
              }}
            >
              Remove Waypoint
            </button>

            <button
              className="bg-blue-400 text-white text-md font-medium rounded-full px-8 py-1 ml-2"
              onClick={(e) => {
                e.preventDefault();
                setShowEditWaypointDialog(false);
                onEditWaypoint(waypointDetailsForm);
              }}
            >
              Save
            </button>
          </div>
        </DialogLayout>
      )}
    </>
  );
}
