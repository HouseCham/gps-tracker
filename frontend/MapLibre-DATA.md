# MapLibre GL JS — Implementation Notes

> Research document for the **gps-tracker** React frontend. Goal: render a
> Google-Maps-looking map, plot the device route, and stream live updates.

- **Repo:** <https://github.com/maplibre/maplibre-gl-js>
- **License:** BSD-3-Clause (forked from `mapbox-gl-js` v1 before Mapbox went
  proprietary in Dec 2020)
- **Current version (as of this writing):** `5.x` (latest `5.24.0`)
- **Stack:** TypeScript, WebGL2, vector tiles
- **Docs:** <https://maplibre.org/maplibre-gl-js/docs/>
- **Style spec:** <https://maplibre.org/maplibre-style-spec/>

---

## 1. What it is, in one paragraph

A client-side WebGL renderer that paints **vector tiles** in the browser. You
hand it a _style document_ (JSON describing which sources to load and how to
paint them), it fetches the tiles from a tile server, and composes them on a
canvas. Everything you see on screen — roads, buildings, labels, your route
polyline, your device marker — is a **layer** rendered against a **source**
(a vector/raster/GeoJSON data source). No server-side rendering, no plugin
ecosystem to fight with.

It is the direct spiritual descendant of Mapbox GL JS v1, kept alive by the
MapLibre org (Microsoft, AWS, Maptiler, Komoot as backers). Anything written
for mapbox-gl-js v1 still applies.

---

## 2. Core architecture (the only bits you actually need to know)

The whole library is built on **five concepts**:

| Concept                        | What it is                                                                           | When you touch it                              |
| ------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `Map`                          | The map instance. Owns the canvas, camera, event loop.                               | Once per component.                            |
| `Style`                        | A JSON document: which sources, which layers, which fonts/icons.                     | At init; optionally swap to change look.       |
| `Source`                       | Raw data the map can read. Types: `vector`, `raster`, `geojson`.                     | When you add the basemap or your route.        |
| `Layer`                        | A paint recipe applied to a source: lines, fills, symbols, circles, fills-extrusion. | When you add markers/routes/clusters.          |
| `Marker` / `Popup` / `Control` | HTML overlays anchored to lng/lat or to the map chrome.                              | Device marker, info bubbles, zoom/nav buttons. |

Mental model:

```
Map
 └── Style (JSON)
      ├── Source "basemap"  → vector tiles from XYZ/PMTiles
      ├── Source "route"    → GeoJSON LineString of GPS points
      │    └── Layer "route-line"     (line paint, blue, width 4)
      │    └── Layer "route-arrows"   (symbol, direction)
      └── Source "device"   → GeoJSON Point (single feature, mutates)
           └── Layer "device-pulse"   (circle paint, animated radius)
```

### Style document shape (skeleton)

```json
{
    "version": 8,
    "glyphs": "https://fonts.example.com/{fontstack}/{range}.pbf",
    "sprite": "https://tiles.example.com/sprite",
    "sources": {
        "basemap": {
            "type": "vector",
            "url": "https://tiles.example.com/tiles.json"
        }
    },
    "layers": [
        {
            "id": "background",
            "type": "background",
            "paint": { "background-color": "#e8eef3" }
        },
        {
            "id": "water",
            "source": "basemap",
            "source-layer": "water",
            "type": "fill",
            "paint": { "fill-color": "#a8c8e8" }
        }
    ]
}
```

You will rarely write this from scratch for the basemap — you use a **hosted
style URL** or a community style. You will write it for _your_ overlays
(route line, device marker, clusters).

---

## 3. Making it look like Google Maps

This is the requirement that drove the choice. Three knobs:

### 3.1 Pick a Google-Maps-looking basemap style

MapLibre is unstyled by itself; the look comes from the style document. For a
"Google Maps streets" appearance, use one of:

| Provider                | Style URL pattern                                                                                                               | Free tier                                | Notes                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **MapTiler**            | `https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY`                                                                 | ~100k tile loads/mo                      | Closest to Google Maps out-of-the-box. Paid above free tier; needs key.                                   |
| **Stadia Maps**         | `https://tiles.stadiamaps.com/styles/osm_bright.json?api_key=YOUR_KEY`                                                          | 200k req/mo free (no key needed for dev) | Cleaner than OSM raw, less "Google" than MapTiler.                                                        |
| **Protomaps + PMTiles** | Self-hosted single `.pmtiles` file, schema = OpenMapTiles (basemaps.cartocdn.com/gl/voyager-gl-style/style.json or OpenFreeMap) | Unlimited, fully open                    | The "true OSS" path: serve one static file from your own CDN.                                             |
| **OpenFreeMap**         | `https://tiles.openfreemap.org/styles/liberty`                                                                                  | Unlimited, no key                        | Hosted by Hartmut Holzgraefe; community-run; vector + raster + glyphs. **Good default for OSS projects.** |

**Recommendation for this project:** start with **OpenFreeMap** (no key, no
billing, OSS-friendly) for development; offer MapTiler as an opt-in env var
for users who want a more polished look. Both work with MapLibre unchanged.

```ts
// env: VITE_MAP_STYLE_URL
const style =
    import.meta.env.VITE_MAP_STYLE_URL ??
    'https://tiles.openfreemap.org/styles/liberty';
```

### 3.2 Disable the things Google Maps hides

Google Maps hides the rotation/pitch affordances by default, hides the
"compass" until you rotate, and renders a clean attribution strip. MapLibre's
defaults are noisier. On the Map options:

```ts
const map = new maplibregl.Map({
    style,
    center: [lng, lat],
    zoom: 15,
    pitch: 0, // Google Maps is flat by default
    bearing: 0,
    attributionControl: { compact: true }, // hides the long attributions
    // disable noisy controls and gestures
    dragRotate: false, // no two-finger rotate; Google doesn't expose it
    pitchWithRotate: false,
    touchPitch: false,
    boxZoom: false, // Google Maps has no shift-drag-box zoom
});
```

### 3.3 Re-skin controls to match Google

Google's controls are flat, white, soft-shadow rounded squares. The stock
MapLibre `NavigationControl` and `GeolocateControl` already look very close
(they were literally copied from Mapbox). Add them and you're 90% there:

```ts
map.addControl(
    new maplibregl.NavigationControl({ visualizePitch: false }),
    'top-right'
);
map.addControl(
    new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true, // ★ for a GPS tracker, this is your "follow device" mode
        showUserHeading: true,
    }),
    'top-right'
);
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
```

Two CSS overrides finish the look:

```css
/* round the corners like Google; stock is 4px, Google is 8px */
.maplibregl-ctrl-group {
    border-radius: 8px !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}
/* hide the MapLibre logo ghost if your attribution permits (don't actually do this without reading attribution terms) */
```

> **Attribution:** keep the attribution control visible — every tile provider
> requires it. `compact: true` keeps it tidy.

---

## 4. React integration

There is **no official React component**, but the de-facto binding is
**`react-map-gl`** by vis.gl (the deck.gl team). It exposes `<Map>`,
`<Marker>`, `<Popup>`, `<Source>`, `<Layer>`, `<NavigationControl>` etc. as
typed React components and handles the imperative `Map` lifecycle for you.

### Install

```bash
npm install maplibre-gl react-map-gl
```

### Minimal skeleton (vanilla style)

```tsx
import Map, {
    Marker,
    NavigationControl,
    ScaleControl,
    GeolocateControl,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState } from 'react';

export function TrackerMap() {
    const [viewState, setViewState] = useState({
        longitude: -99.1332,
        latitude: 19.4326,
        zoom: 14,
        pitch: 0,
        bearing: 0,
    });

    return (
        <Map
            {...viewState}
            onMove={e => setViewState(e.viewState)}
            mapStyle={
                import.meta.env.VITE_MAP_STYLE_URL ??
                'https://tiles.openfreemap.org/styles/liberty'
            }
            style={{ width: '100%', height: '100%' }}
            dragRotate={false}
            pitchWithRotate={false}
            touchPitch={false}
            boxZoom={false}
            attributionControl={{ compact: true }}
        >
            <NavigationControl position="top-right" visualizePitch={false} />
            <GeolocateControl
                position="top-right"
                trackUserLocation
                showUserHeading
            />
            <ScaleControl position="bottom-left" unit="metric" />
            {/* <Marker longitude={lng} latitude={lat} anchor="center"><YourIcon/></Marker> */}
        </Map>
    );
}
```

### Imperative escape hatch

`react-map-gl` covers ~95% of cases declaratively. For the other 5% (custom
layers, real-time `setData` updates, geolocation pulse animation, easing
camera), grab the underlying `Map` instance via the `ref`:

```tsx
import type { MapRef } from 'react-map-gl/maplibre';

const mapRef = useRef<MapRef>(null);
mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 1200 });
mapRef.current?.getMap().getSource('route')?.setData(geojson);
```

---

## 5. GPS-tracker-specific patterns

### 5.1 The route as a `GeoJSONSource` + `line` layer (not a `Marker`)

Don't draw the route as a chain of markers. Add a single GeoJSON source and
update it:

```tsx
import { Source, Layer } from 'react-map-gl/maplibre';

const routeGeoJson = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: gpsPoints.map(p => [p.lng, p.lat]),
            },
            properties: {},
        },
    ],
};

<Source id="route" type="geojson" data={routeGeoJson}>
    <Layer
        id="route-line"
        type="line"
        paint={{
            'line-color': '#1a73e8', // Google Maps blue
            'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10,
                3,
                16,
                6,
                19,
                10,
            ],
            'line-opacity': 0.9,
        }}
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
    />
</Source>;
```

For best perf on a long route, use `tolerance` / `simplification` (Douglas–
Peucker is built into the GeoJSON source via the `tolerance` option in v5+)
to drop redundant points at low zoom. MapLibre can paint **millions** of
polyline points smoothly — the bottleneck is usually the JSON parse, so
update the source via `setData` not by recreating it.

### 5.2 The device marker

Two options:

- **`<Marker>`** (HTML overlay): easiest, supports React children (custom
  icons, animations via CSS), but each marker is a DOM node. Fine for a
  single device. Use `anchor="center"` and a pulsing-dot SVG.
- **GeoJSON point + circle layer**: GPU-rendered, scales to many devices,
  but you lose CSS animations. Use this if you'll show a fleet.

### 5.3 Live updates

Three patterns, in increasing order of complexity:

1. **Polling** — `setInterval` refetching from your API. Simple, fine for
   personal-tracker scale.
2. **SSE / WebSocket** — push deltas from the backend. MapLibre doesn't care
   about transport; you just call `source.setData(newGeoJson)`.
3. **True realtime** — same as 2 but use `requestAnimationFrame` to interpolate
   the marker position between server updates for smooth motion.

Always mutate the source with `setData`, **never** unmount/remount the
`<Source>`. Recreation drops the WebGL buffers.

### 5.4 Following the device

Combine `GeolocateControl` with `mapRef.current?.easeTo({ center, duration })`
or `flyTo`. Google Maps uses a smooth `easeTo` over ~300–800 ms when you tap
"locate me" — copy that.

### 5.5 Clustering many devices

If you go beyond one tracker, cluster the GeoJSON points with `cluster: true`
on the source. MapLibre does it on the worker thread:

```ts
{ type: 'geojson', data, cluster: true, clusterRadius: 50, clusterMaxZoom: 14 }
```

Then add three layers: clusters (circles), cluster-count (symbol), and
unclustered points. The official example "Create and style clusters" is the
template.

---

## 6. Performance tips that actually matter

- **Mutate, don't re-render.** Update source data with `setData`. Don't
  recreate the `<Source>` on every state change.
- **One map, many layers.** A single Map instance handles every layer; never
  nest two `<Map>`s unless you have a strong reason.
- **Decimate the route.** 1 point/sec is overkill. 1 point every 5–10 s is
  fine for "where has the device been"; 1 Hz only when actively moving.
- **Avoid GeoJSON for >100k features.** Beyond that, switch to a vector tile
  source (your backend serves `.pbf` tiles) or PMTiles.
- **Limit max zoom.** Cap at `19` — beyond that, tile coverage drops and the
  basemap goes blank.
- **Use `requestAnimationFrame` for marker tweening**, not `setInterval`.

---

## 7. Common gotchas

- **Forgetting the CSS import.** Without `maplibre-gl/dist/maplibre-gl.css`,
  popups and controls render at zero size. This bites everyone once.
- **Wrong coordinate order.** MapLibre uses `[longitude, latitude]` (GeoJSON
  order). React component props are `longitude` / `latitude` separately, but
  GeoJSON geometry is `[lng, lat]`.
- **`flyTo` vs `easeTo`.** `flyTo` does a curved arc (dramatic, Google-Maps-
  directions-style). `easeTo` does a straight ease. For "recenter on device"
  use `easeTo`.
- **CORS on tile server.** Self-hosted tiles must send `Access-Control-Allow-Origin`. OpenFreeMap, MapTiler, Stadia handle this; a raw `nginx` serving
  `.pbf` won't unless configured.
- **CSS conflicts.** MapLibre renders into a `<canvas>` inside a `<div
class="maplibregl-map">`. If your layout system (Tailwind, MUI) sets
  `position: static` on every div, the map will collapse — set the container
  to have explicit `width`/`height` and `position: relative`.
- **Markers appear at the wrong zoom.** `Marker` is an HTML overlay, not a
  layer. To hide/show with zoom, conditionally render it.

---

## 8. TL;DR stack for gps-tracker

```
react-map-gl@8       ← React wrapper, declarative Map/Marker/Source/Layer
maplibre-gl@5        ← the renderer itself
openfreemap          ← default basemap style (no key, no billing, OSS)
optional:
  pmtiles + protomaps ← self-host the basemap as a single static file
  supercluster       ← only if you outgrow the built-in clustering
```

Zero vendor lock-in. Zero API keys for the default. Drop-in to a Vite/CRA
React app in ~30 lines.

---

## 9. References

- Repo: <https://github.com/maplibre/maplibre-gl-js>
- Docs: <https://maplibre.org/maplibre-gl-js/docs/>
- Style spec: <https://maplibre.org/maplibre-style-spec/>
- Examples: <https://maplibre.org/maplibre-gl-js/docs/examples/>
- React binding: <https://visgl.github.io/react-map-gl/docs/get-started>
- OpenFreeMap (default basemap): <https://openfreemap.org/>
- Leaflet migration (in case of fallback): <https://maplibre.org/maplibre-gl-js/docs/guides/leaflet-migration-guide/>
