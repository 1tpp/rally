import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

export default function Waypoint({
  waypoint,
  index,
  totalOfWaypoint,
  removeWaypointFromRoute,
  onEditWaypoint,
}) {
  const [showRemoveWaypointDialog, setShowRemoveWaypointDialog] =
    useState(false);

  return (
    <>
      <div className="flex p-3 bg-neutral-50 hover:bg-neutral-100 rounded-md justify-between items-center hover:ring-2 hover:ring-neutral-400">
        <button className="flex items-center">
          <span className="text-xl font-medium text-neutral-400 mr-4 cursor-grab">
            {index + 1}
          </span>

          <div
            className="flex flex-col text-left group cursor-pointer"
            onClick={() => onEditWaypoint(waypoint)}
          >
            <h2 className="text-md font-medium text-neutral-700 capitalize group-hover:underline">
              {waypoint.name}
              </h2>
            <span className="text-sm text-neutral-400 capitalize">
              {waypoint.amenity}
            </span>
          </div>
        </button>
        <button
          className="cursor-pointer"
          onClick={() => {
            if (index === totalOfWaypoint - 1 && index === 0) {
              setShowRemoveWaypointDialog(true);
            } else {
              removeWaypointFromRoute(waypoint);
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 text-neutral-300 hover:text-red-500"
          >
            <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
            <path
              fillRule="evenodd"
              d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.133 2.845a.75.75 0 011.06 0l1.72 1.72 1.72-1.72a.75.75 0 111.06 1.06l-1.72 1.72 1.72 1.72a.75.75 0 11-1.06 1.06L12 15.685l-1.72 1.72a.75.75 0 11-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {showRemoveWaypointDialog && (
        <ConfirmDialog
          title="Remove Waypoint"
          message="Are you sure you want to remove this waypoint? This trip will be deleted."
          onConfirm={() => {
            removeWaypointFromRoute(waypoint);
            setShowRemoveWaypointDialog(false);
          }}
          onCancel={() => setShowRemoveWaypointDialog(false)}
        />
      )}
    </>
  );
}
