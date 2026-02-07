/**
 * Polygon offset utility - Backend version of frontend mathUtils.ts
 * Offsets (insets/outsets) a polygon by a given distance using miter-join bisector calculations.
 */

export interface Point {
    x: number;
    z: number;
}

export function offsetPolygon(points: Point[], distance: number): Point[] {
    if (!points || points.length < 3) return points || [];

    const offsetPoints: Point[] = [];
    const len = points.length;

    for (let i = 0; i < len; i++) {
        const p1 = points[(i - 1 + len) % len];
        const p2 = points[i];
        const p3 = points[(i + 1) % len];

        if (!p1 || !p2 || !p3) continue;

        const v1 = { x: p2.x - p1.x, z: p2.z - p1.z };
        const v2 = { x: p3.x - p2.x, z: p3.z - p2.z };

        const l1 = Math.hypot(v1.x, v1.z);
        const l2 = Math.hypot(v2.x, v2.z);

        if (l1 < 1e-6 || l2 < 1e-6) {
            offsetPoints.push({ ...p2 });
            continue;
        }

        const n1 = { x: v1.x / l1, z: v1.z / l1 };
        const n2 = { x: v2.x / l2, z: v2.z / l2 };

        const norm1 = { x: n1.z, z: -n1.x };
        const norm2 = { x: n2.z, z: -n2.x };

        const bisector = { x: norm1.x + norm2.x, z: norm1.z + norm2.z };
        const bisectorLen = Math.hypot(bisector.x, bisector.z);

        const safeBisector =
            bisectorLen < 1e-6
                ? norm1
                : { x: bisector.x / bisectorLen, z: bisector.z / bisectorLen };

        const dot = norm1.x * safeBisector.x + norm1.z * safeBisector.z;
        const offsetLen = Math.abs(dot) > 1e-4 ? distance / dot : distance;

        offsetPoints.push({
            x: p2.x + safeBisector.x * offsetLen,
            z: p2.z + safeBisector.z * offsetLen,
        });
    }

    return offsetPoints;
}
