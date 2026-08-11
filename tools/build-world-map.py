"""Build the land outline path embedded in clock.html.

Downloads the Natural Earth 110m land polygons (via the world-atlas TopoJSON
build, ISC licensed, https://github.com/topojson/world-atlas), projects them
equirectangularly into a 1000x500 SVG box, simplifies the rings and prints one
`d` attribute. Paste the result into the `<path class="wc-land">` in clock.html.

    python3 tools/build-world-map.py > land.txt

Run it only when the map needs regenerating. clock.html ships the output inline
so the page fetches nothing to draw itself.
"""

import json
import urllib.request
from pathlib import Path

SOURCE = "https://unpkg.com/world-atlas@2/land-110m.json"
CACHE = Path("land-110m.json")

MAP_W, MAP_H = 1000.0, 500.0
DECIMALS = 1
EPSILON = 0.45   # Douglas-Peucker tolerance, in units of the 1000x500 box
MIN_AREA = 1.2   # drop islands smaller than this, they only add noise
WRAP = 400.0     # an x jump this large means the ring crossed the antimeridian

Point = tuple[float, float]


def fetch() -> dict:
    if not CACHE.exists():
        with urllib.request.urlopen(SOURCE) as response:
            CACHE.write_bytes(response.read())
    return json.loads(CACHE.read_text())


def decode_arcs(topo: dict) -> list[list[Point]]:
    """Undo TopoJSON's quantised delta encoding."""
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        points = []
        for dx, dy in arc:
            x += dx
            y += dy
            points.append((x * sx + tx, y * sy + ty))
        arcs.append(points)
    return arcs


def ring_points(arcs: list[list[Point]], indexes: list[int]) -> list[Point]:
    points: list[Point] = []
    for i in indexes:
        segment = arcs[~i][::-1] if i < 0 else arcs[i]
        points.extend(segment[1:] if points else segment)
    return points


def project(lon: float, lat: float) -> Point:
    return ((lon + 180.0) / 360.0 * MAP_W, (90.0 - lat) / 180.0 * MAP_H)


def area(points: list[Point]) -> float:
    total = 0.0
    for i, (x1, y1) in enumerate(points):
        x2, y2 = points[(i + 1) % len(points)]
        total += x1 * y2 - x2 * y1
    return abs(total) / 2


def simplify(points: list[Point], epsilon: float) -> list[Point]:
    if len(points) < 3:
        return points
    ax, ay = points[0]
    bx, by = points[-1]
    dx, dy = bx - ax, by - ay
    length = (dx * dx + dy * dy) ** 0.5
    worst, index = -1.0, 0
    for i, (px, py) in enumerate(points[1:-1], start=1):
        if length == 0:
            dist = ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
        else:
            dist = abs(dy * px - dx * py + bx * ay - by * ax) / length
        if dist > worst:
            worst, index = dist, i
    if worst <= epsilon:
        return [points[0], points[-1]]
    return simplify(points[: index + 1], epsilon)[:-1] + simplify(points[index:], epsilon)


def unwrap(points: list[Point]) -> list[list[Point]]:
    """Split rings that cross the antimeridian, so none streak across the map."""
    jumps = [i for i in range(len(points)) if abs(points[i][0] - points[i - 1][0]) > WRAP]
    if not jumps:
        return [points]
    rotated = points[jumps[0]:] + points[: jumps[0]]
    pieces: list[list[Point]] = []
    current = [rotated[0]]
    for a, b in zip(rotated, rotated[1:]):
        if abs(b[0] - a[0]) > WRAP:
            pieces.append(current)
            current = [b]
        else:
            current.append(b)
    pieces.append(current)
    edge = lambda x: 0.0 if x < MAP_W / 2 else MAP_W
    return [
        [(edge(p[0][0]), p[0][1])] + p + [(edge(p[-1][0]), p[-1][1])]
        for p in pieces if len(p) >= 2
    ]


def main() -> None:
    topo = fetch()
    arcs = decode_arcs(topo)
    polygons: list[list[list[int]]] = []
    for geometry in topo["objects"]["land"]["geometries"]:
        if geometry["type"] == "Polygon":
            polygons.append(geometry["arcs"])
        elif geometry["type"] == "MultiPolygon":
            polygons.extend(geometry["arcs"])

    subpaths: list[str] = []
    for polygon in polygons:
        for ring in polygon:
            projected: list[Point] = []
            for lon, lat in ring_points(arcs, ring):
                x, y = project(lon, lat)
                point = (round(x, DECIMALS), round(y, DECIMALS))
                if not projected or point != projected[-1]:
                    projected.append(point)
            if len(projected) < 3 or area(projected) < MIN_AREA:
                continue
            for piece in unwrap(simplify(projected, EPSILON)):
                if len(piece) < 3:
                    continue
                head = f"M{piece[0][0]:g} {piece[0][1]:g}"
                subpaths.append(head + "".join(f"L{x:g} {y:g}" for x, y in piece[1:]) + "Z")

    print("".join(subpaths))


if __name__ == "__main__":
    main()
