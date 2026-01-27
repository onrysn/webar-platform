/**
 * Layer Manager Composable
 * Manages floor layer state and operations
 */

import { ref, computed } from 'vue';
import type { FloorLayer, LayerPoint, LayerTexture } from '../types/geometry';
import { generateFilletPath, calculateBoundingBox } from '../utils/geometryEngine';

export function useLayerManager() {
    const layers = ref<FloorLayer[]>([]);
    const selectedLayerId = ref<string | null>(null);
    const draggingLayerId = ref<string | null>(null);
    
    const selectedLayer = computed(() => 
        layers.value.find(l => l.id === selectedLayerId.value) || null
    );
    
    /**
     * Create a new preset shape layer
     */
    const createPresetLayer = (
        shapeId: string,
        name: string,
        x: number,
        z: number,
        width: number = 1,
        height: number = 1
    ): FloorLayer => {
        const layer: FloorLayer = {
            id: crypto.randomUUID(),
            shapeId,
            name,
            x,
            z,
            width,
            height,
            rotation: 0,
            color: '#3b82f6',
            opacity: 0.8,
            zIndex: layers.value.length + 1,
            geometryType: 'preset'
        };
        
        layers.value.push(layer);
        selectedLayerId.value = layer.id;
        
        return layer;
    };
    
    /**
     * Create a new freehand layer
     */
    const createFreehandLayer = (
        name: string,
        points: LayerPoint[]
    ): FloorLayer => {
        const bbox = calculateBoundingBox(points);
        
        // Normalize points to center (0,0)
        const normalizedPoints = points.map(p => ({
            x: p.x - bbox.centerX,
            z: p.z - bbox.centerZ,
            fillet: p.fillet ? { ...p.fillet } : undefined
        }));
        
        const layer: FloorLayer = {
            id: crypto.randomUUID(),
            shapeId: 'freehand',
            name,
            x: bbox.centerX,
            z: bbox.centerZ,
            width: bbox.width,
            height: bbox.height,
            rotation: 0,
            color: '#3b82f6',
            opacity: 0.8,
            zIndex: layers.value.length + 1,
            geometryType: 'freehand',
            points: normalizedPoints
        };
        
        layers.value.push(layer);
        selectedLayerId.value = layer.id;
        
        return layer;
    };
    
    /**
     * Update layer points (for freehand layers)
     */
    const updateLayerPoints = (layerId: string, points: LayerPoint[]) => {
        const layer = layers.value.find(l => l.id === layerId);
        if (!layer || layer.geometryType !== 'freehand') return;
        
        const bbox = calculateBoundingBox(points);
        
        // Normalize points to center (0,0)
        const normalizedPoints = points.map(p => ({
            x: p.x - bbox.centerX,
            z: p.z - bbox.centerZ,
            fillet: p.fillet ? { ...p.fillet } : undefined
        }));
        
        layer.points = normalizedPoints;
        layer.x = bbox.centerX;
        layer.z = bbox.centerZ;
        layer.width = bbox.width;
        layer.height = bbox.height;
    };
    
    /**
     * Set texture for a layer
     */
    const setLayerTexture = (layerId: string, texture: LayerTexture | null) => {
        const layer = layers.value.find(l => l.id === layerId);
        if (!layer) return;
        
        layer.texture = texture ? { ...texture } : undefined;
    };
    
    /**
     * Set fillet for a specific point in a layer
     */
    const setPointFillet = (
        layerId: string,
        pointIndex: number,
        radius: number,
        type: 'arc' | 'chamfer' = 'arc'
    ) => {
        const layer = layers.value.find(l => l.id === layerId);
        if (!layer || layer.geometryType !== 'freehand' || !layer.points) return;
        
        const point = layer.points[pointIndex];
        if (!point) return;
        
        if (radius > 0) {
            point.fillet = { radius, type };
        } else {
            delete point.fillet;
        }
    };
    
    /**
     * Remove layer
     */
    const removeLayer = (layerId: string) => {
        layers.value = layers.value.filter(l => l.id !== layerId);
        if (selectedLayerId.value === layerId) {
            selectedLayerId.value = null;
        }
    };
    
    /**
     * Bring layer to front
     */
    const bringToFront = (layerId: string) => {
        const layer = layers.value.find(l => l.id === layerId);
        if (!layer) return;
        
        // Find max zIndex
        const maxZIndex = Math.max(...layers.value.map(l => l.zIndex || 0), 0);
        
        // Set this layer's zIndex to max + 1
        layer.zIndex = maxZIndex + 1;
        
        // Also reorder array
        layers.value = layers.value.filter(l => l.id !== layerId);
        layers.value.push(layer);
    };
    
    /**
     * Send layer to back
     */
    const sendToBack = (layerId: string) => {
        const layer = layers.value.find(l => l.id === layerId);
        if (!layer) return;
        
        // Find min zIndex
        const minZIndex = Math.min(...layers.value.map(l => l.zIndex || 0), 0);
        
        // Set this layer's zIndex to min - 1
        layer.zIndex = minZIndex - 1;
        
        // Also reorder array
        layers.value = layers.value.filter(l => l.id !== layerId);
        layers.value.unshift(layer);
    };
    
    /**
     * Generate SVG path for a layer
     */
    const getLayerPath = (layer: FloorLayer, shapePath?: string): string => {
        if (layer.geometryType === 'freehand' && layer.points) {
            return generateFilletPath(layer.points, true);
        } else if (shapePath) {
            return shapePath;
        }
        return '';
    };
    
    /**
     * Clear all layers
     */
    const clearLayers = () => {
        layers.value = [];
        selectedLayerId.value = null;
        draggingLayerId.value = null;
    };
    
    return {
        layers,
        selectedLayerId,
        draggingLayerId,
        selectedLayer,
        createPresetLayer,
        createFreehandLayer,
        updateLayerPoints,
        setLayerTexture,
        setPointFillet,
        removeLayer,
        bringToFront,
        sendToBack,
        getLayerPath,
        clearLayers
    };
}
