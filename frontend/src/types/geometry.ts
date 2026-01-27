/**
 * Geometry Types for AR Scene Layer System
 * Advanced geometry manipulation with fillet/chamfer support
 */

export type FilletType = 'arc' | 'chamfer';

export interface LayerPoint {
    x: number;
    z: number;
    fillet?: {
        radius: number;
        type: FilletType;
    };
}

export interface LayerTexture {
    id?: number;           // PBR Texture ID
    url?: string;          // Simple Texture URL
    scale: number;         // Texture repeat scale (1x, 2x, 4x, 8x)
    thumbnailUrl?: string; // Preview thumbnail
}

export type GeometryType = 'preset' | 'freehand';

export interface FloorLayer {
    id: string;
    shapeId: string;
    name: string;
    x: number;
    z: number;
    width: number;
    height: number;
    rotation: number;
    color: string;
    opacity: number;
    zIndex: number;
    
    // New: Freehand geometry support
    geometryType: GeometryType;
    points?: LayerPoint[];
    
    // New: Layer-specific texture support
    texture?: LayerTexture;
}

export interface BoundingBox {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    width: number;
    height: number;
    centerX: number;
    centerZ: number;
}

export interface Point2D {
    x: number;
    z: number;
}
