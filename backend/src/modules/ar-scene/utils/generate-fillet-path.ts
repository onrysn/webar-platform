/**
 * Fillet path generator - Backend version of frontend geometryEngine.ts
 * Generates SVG path strings from layer points with optional fillets/chamfers.
 */

export interface Point2D {
    x: number;
    z: number;
}

export interface LayerPoint extends Point2D {
    fillet?: {
        radius: number;
        type: 'round' | 'chamfer';
    };
}

function distance(p1: Point2D, p2: Point2D): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
}

function normalize(p: Point2D): Point2D {
    const len = Math.sqrt(p.x * p.x + p.z * p.z);
    if (len === 0) return { x: 0, z: 0 };
    return { x: p.x / len, z: p.z / len };
}

function vector(p1: Point2D, p2: Point2D): Point2D {
    return { x: p2.x - p1.x, z: p2.z - p1.z };
}

function generateArcPoints(
    center: Point2D,
    radius: number,
    startAngle: number,
    endAngle: number,
    segments: number = 8,
): Point2D[] {
    const points: Point2D[] = [];
    let angleDiff = endAngle - startAngle;
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = startAngle + angleDiff * t;
        points.push({
            x: center.x + radius * Math.cos(angle),
            z: center.z + radius * Math.sin(angle),
        });
    }
    return points;
}

function calculateFilletPoints(
    prevPoint: Point2D,
    cornerPoint: LayerPoint,
    nextPoint: Point2D,
): Point2D[] {
    if (!cornerPoint.fillet || cornerPoint.fillet.radius <= 0) {
        return [{ x: cornerPoint.x, z: cornerPoint.z }];
    }
    const radius = cornerPoint.fillet.radius;
    const type = cornerPoint.fillet.type;

    const v1 = normalize(vector(cornerPoint, prevPoint));
    const v2 = normalize(vector(cornerPoint, nextPoint));
    const dot = v1.x * v2.x + v1.z * v2.z;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

    if (angle < 0.01 || angle > Math.PI - 0.01) {
        return [{ x: cornerPoint.x, z: cornerPoint.z }];
    }

    const tangentDist = radius / Math.tan(angle / 2);
    const dist1 = distance(cornerPoint, prevPoint);
    const dist2 = distance(cornerPoint, nextPoint);

    if (tangentDist > dist1 * 0.9 || tangentDist > dist2 * 0.9) {
        const maxRadius = Math.min(dist1, dist2) * 0.4;
        return calculateFilletPoints(
            prevPoint,
            { ...cornerPoint, fillet: { ...cornerPoint.fillet, radius: maxRadius } },
            nextPoint,
        );
    }

    const t1 = {
        x: cornerPoint.x + v1.x * tangentDist,
        z: cornerPoint.z + v1.z * tangentDist,
    };
    const t2 = {
        x: cornerPoint.x + v2.x * tangentDist,
        z: cornerPoint.z + v2.z * tangentDist,
    };

    if (type === 'chamfer') {
        return [t1, t2];
    } else {
        const bisector = normalize({ x: v1.x + v2.x, z: v1.z + v2.z });
        const centerDist = radius / Math.sin(angle / 2);
        const center = {
            x: cornerPoint.x + bisector.x * centerDist,
            z: cornerPoint.z + bisector.z * centerDist,
        };
        const angle1 = Math.atan2(t1.z - center.z, t1.x - center.x);
        const angle2 = Math.atan2(t2.z - center.z, t2.x - center.x);
        const segments = Math.max(4, Math.ceil(angle * radius * 2));
        return generateArcPoints(center, radius, angle1, angle2, segments);
    }
}

export function generateFilletPath(points: LayerPoint[], closed: boolean = true): string {
    if (points.length < 2) return '';
    const processedPoints: Point2D[] = [];

    for (let i = 0; i < points.length; i++) {
        const prevIdx = i === 0 ? points.length - 1 : i - 1;
        const nextIdx = (i + 1) % points.length;
        const prev = points[prevIdx];
        const current = points[i];
        const next = points[nextIdx];
        if (!prev || !current || !next) continue;

        if (i === 0 && !closed) {
            processedPoints.push({ x: current.x, z: current.z });
            continue;
        }
        if (i === points.length - 1 && !closed) {
            processedPoints.push({ x: current.x, z: current.z });
            continue;
        }

        const filletPoints = calculateFilletPoints(prev, current, next);
        processedPoints.push(...filletPoints);
    }

    if (processedPoints.length === 0) return '';
    const firstPoint = processedPoints[0];
    if (!firstPoint) return '';

    let path = `M ${firstPoint.x} ${firstPoint.z}`;
    for (let i = 1; i < processedPoints.length; i++) {
        const p = processedPoints[i];
        if (p) path += ` L ${p.x} ${p.z}`;
    }
    if (closed) path += ' Z';
    return path;
}
