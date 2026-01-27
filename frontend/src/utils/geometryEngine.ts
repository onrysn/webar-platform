/**
 * Geometry Engine for AR Scene
 * Handles fillet/chamfer calculations, path generation, and geometric operations
 */

import type { LayerPoint, Point2D, BoundingBox } from '../types/geometry';

/**
 * Calculate distance between two points
 */
export function distance(p1: Point2D, p2: Point2D): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
}

/**
 * Normalize a vector
 */
export function normalize(p: Point2D): Point2D {
    const len = Math.sqrt(p.x * p.x + p.z * p.z);
    if (len === 0) return { x: 0, z: 0 };
    return { x: p.x / len, z: p.z / len };
}

/**
 * Calculate vector from p1 to p2
 */
export function vector(p1: Point2D, p2: Point2D): Point2D {
    return { x: p2.x - p1.x, z: p2.z - p1.z };
}

/**
 * Generate arc points for fillet
 */
function generateArcPoints(
    center: Point2D,
    radius: number,
    startAngle: number,
    endAngle: number,
    segments: number = 8
): Point2D[] {
    const points: Point2D[] = [];
    
    // Normalize angles to ensure correct direction
    let angleDiff = endAngle - startAngle;
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = startAngle + angleDiff * t;
        points.push({
            x: center.x + radius * Math.cos(angle),
            z: center.z + radius * Math.sin(angle)
        });
    }
    
    return points;
}

/**
 * Calculate fillet for a corner point
 * Returns array of points that replace the corner
 */
export function calculateFilletPoints(
    prevPoint: Point2D,
    cornerPoint: LayerPoint,
    nextPoint: Point2D
): Point2D[] {
    if (!cornerPoint.fillet || cornerPoint.fillet.radius <= 0) {
        return [{ x: cornerPoint.x, z: cornerPoint.z }];
    }
    
    const radius = cornerPoint.fillet.radius;
    const type = cornerPoint.fillet.type;
    
    // Vectors from corner to adjacent points
    const v1 = normalize(vector(cornerPoint, prevPoint));
    const v2 = normalize(vector(cornerPoint, nextPoint));
    
    // Calculate angle between vectors
    const dot = v1.x * v2.x + v1.z * v2.z;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    
    // If angle is too small (nearly straight line), no fillet
    if (angle < 0.01 || angle > Math.PI - 0.01) {
        return [{ x: cornerPoint.x, z: cornerPoint.z }];
    }
    
    // Distance from corner to tangent points
    const tangentDist = radius / Math.tan(angle / 2);
    
    // Check if radius is too large
    const dist1 = distance(cornerPoint, prevPoint);
    const dist2 = distance(cornerPoint, nextPoint);
    if (tangentDist > dist1 * 0.9 || tangentDist > dist2 * 0.9) {
        // Radius too large, reduce it
        const maxRadius = Math.min(dist1, dist2) * 0.4;
        return calculateFilletPoints(prevPoint, { ...cornerPoint, fillet: { ...cornerPoint.fillet, radius: maxRadius } }, nextPoint);
    }
    
    // Calculate tangent points
    const t1: Point2D = {
        x: cornerPoint.x + v1.x * tangentDist,
        z: cornerPoint.z + v1.z * tangentDist
    };
    
    const t2: Point2D = {
        x: cornerPoint.x + v2.x * tangentDist,
        z: cornerPoint.z + v2.z * tangentDist
    };
    
    if (type === 'chamfer') {
        // Simple chamfer: just connect the two tangent points
        return [t1, t2];
    } else {
        // Arc fillet
        // Calculate center of arc
        const bisector = normalize({
            x: v1.x + v2.x,
            z: v1.z + v2.z
        });
        
        const centerDist = radius / Math.sin(angle / 2);
        const center: Point2D = {
            x: cornerPoint.x + bisector.x * centerDist,
            z: cornerPoint.z + bisector.z * centerDist
        };
        
        // Calculate angles for arc
        const angle1 = Math.atan2(t1.z - center.z, t1.x - center.x);
        const angle2 = Math.atan2(t2.z - center.z, t2.x - center.x);
        
        // Generate arc points
        const segments = Math.max(4, Math.ceil(angle * radius * 2));
        return generateArcPoints(center, radius, angle1, angle2, segments);
    }
}

/**
 * Generate SVG path from points with fillet support
 */
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
        
        // For first point in open path, don't apply fillet
        if (i === 0 && !closed) {
            processedPoints.push({ x: current.x, z: current.z });
            continue;
        }
        
        // For last point in open path, don't apply fillet
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
        if (p) {
            path += ` L ${p.x} ${p.z}`;
        }
    }
    
    if (closed) {
        path += ' Z';
    }
    
    return path;
}

/**
 * Calculate bounding box for a set of points
 */
export function calculateBoundingBox(points: LayerPoint[]): BoundingBox {
    if (points.length === 0) {
        return { minX: 0, maxX: 0, minZ: 0, maxZ: 0, width: 0, height: 0, centerX: 0, centerZ: 0 };
    }
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    
    for (const p of points) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minZ = Math.min(minZ, p.z);
        maxZ = Math.max(maxZ, p.z);
    }
    
    return {
        minX,
        maxX,
        minZ,
        maxZ,
        width: maxX - minX,
        height: maxZ - minZ,
        centerX: (minX + maxX) / 2,
        centerZ: (minZ + maxZ) / 2
    };
}

/**
 * Check if point is near another point (for snapping)
 */
export function isNearPoint(p1: Point2D, p2: Point2D, threshold: number = 0.3): boolean {
    return distance(p1, p2) < threshold;
}

/**
 * Snap point to grid
 */
export function snapToGrid(point: Point2D, gridSize: number = 0.1): Point2D {
    return {
        x: Math.round(point.x / gridSize) * gridSize,
        z: Math.round(point.z / gridSize) * gridSize
    };
}
