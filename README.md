# leaflet-locator-grid
Leaflet-based Maidenhead / Locator Grid with automatic level-of-detail switching on map zoom

A lightweight, dependency-free Leaflet plugin for drawing Maidenhead (locator) grid lines and labels, with automatic level-of-detail switching.

Designed for radio amateurs, SOTA/IOTA mapping, portable-ops tools, contesting, and general QTH visualization.

## Features

- Draws Maidenhead blocks at different levels of detail depending on zoom:
  - 2-character Fields (e.g. "JN")
  - 4-character Squares (e.g. "JN53")
  - 6-character Subsquares (e.g. "JN53sn")
  - 8-character Extended squares (e.g. "JN53sn47")    
- Smooth “parachute redraw” logic to avoid flicker and double-rendering.
- Works across the antemeridian / date line (_at least as well as Leaflet can manage!_).
- Pure Leaflet—no external libraries.
- Optimized for performance during pan/zoom.

## Usage

Add directly to map:
```
var map = L.map('map', { });
const locGrid = new LocatorGrid();
locGrid.addTo(map);
```

Add to a layers control:
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

## License

MIT



