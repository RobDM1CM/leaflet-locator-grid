# leaflet-locator-grid
Leaflet-based Maidenhead / Locator Grid with automatic level-of-detail switching on map zoom

A lightweight, dependency-free Leaflet plugin for drawing Maidenhead (locator) grid lines and labels, with automatic level-of-detail switching.

Designed for radio amateurs, SOTA/IOTA mapping, portable-ops tools, contesting, and general QTH visualization.

## Features

- Draws Maidenhead blocks at different levels of detail depending on zoom:
  - 2-character Fields (e.g., "JN")
  - 4-character Squares (e.g., "JN53")
  - 6-character Subsquares (e.g., "JN53sn")
  - 8-character Extended squares (e.g., "JN53sn47")    
- Smooth “parachute redraw” logic to avoid flicker and double-rendering
- Works across the antemeridian / date line (_at least as well as Leaflet can manage!_)
- Pure Leaflet, no external libraries
- Efficient redraws on pan/zoom

## Installation
```
<link rel="stylesheet" href="leaflet.css">
<script src="leaflet.js"></script>

<script src="locator-grid-leaflet.js"></script>
<link rel="stylesheet" href="locator-grid-leaflet.css">
```

## Usage

Add the grid directly to the map:
```
var map = L.map('map', { });
const locGrid = new LocatorGrid();
locGrid.addTo(map);
```

Add the grid as an overlay in ```L.control.layers```:
```
var map = L.map('map', { });
const locGrid = new LocatorGrid();
...
...
var baseMaps = {
    "OpenStreetMap": osm,
    "OpenStreetMap.HOT": osmHOT
};

var overlays = {
    "Locator Grid": locGrid
};

var layerControl = L.control.layers(baseMaps, overlays).addTo(map);
```

## API

```LocatorGrid.addTo(map)```

Adds the grid to the map and starts automatic redraw handling.

```LocatorGrid.remove()```

Removes all grid elements and event listeners.

## Performance Notes

- Redraw fires only on moveend, not on every pan step.
- Zoom work is batched to avoid the “double-opacity” issue common in DOM-based layers.
- Antemeridian drawing is handled gracefully but may show minor artifacts depending on the base map — a minor problem inherent to Leaflet.

## License

MIT



