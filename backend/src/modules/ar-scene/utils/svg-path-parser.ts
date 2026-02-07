/**
 * SVG Path Parser - Converts SVG path `d` attribute to THREE.Shape[]
 * Pure Node.js implementation without browser DOM dependencies.
 * Handles: M, L, H, V, C, S, Q, T, A, Z (absolute & relative)
 */
import * as THREE from 'three';

interface SVGCommand {
    type: string;
    args: number[];
}

/**
 * Tokenize SVG path data string into commands
 */
function tokenizeSVGPath(d: string): SVGCommand[] {
    const commands: SVGCommand[] = [];
    const regex =
        /([MmLlHhVvCcSsQqTtAaZz])\s*((?:[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?(?:\s*,?\s*|\s+))*)/g;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(d)) !== null) {
        const type = match[1];
        const argsStr = match[2].trim();
        const args = argsStr.length > 0 ? argsStr.split(/[\s,]+/).map(Number) : [];
        commands.push({ type, args });
    }

    return commands;
}

/**
 * Convert SVG arc endpoint parameters to center parameterization, then
 * approximate with cubic bezier curves.
 * Reference: https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
 */
function arcToBeziers(
    x1: number, y1: number,
    x2: number, y2: number,
    rx: number, ry: number,
    phi: number,
    largeArc: number,
    sweep: number,
): number[][] {
    // Handle degenerate cases
    if (Math.abs(x2 - x1) < 1e-6 && Math.abs(y2 - y1) < 1e-6) return [];
    if (rx < 1e-6 || ry < 1e-6) return [[x2, y2, x2, y2, x2, y2]]; // line to

    rx = Math.abs(rx);
    ry = Math.abs(ry);

    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    // Step 1: Compute (x1', y1')
    const dx2 = (x1 - x2) / 2;
    const dy2 = (y1 - y2) / 2;
    const x1p = cosPhi * dx2 + sinPhi * dy2;
    const y1p = -sinPhi * dx2 + cosPhi * dy2;

    // Step 2: Compute (cx', cy')
    let rxSq = rx * rx;
    let rySq = ry * ry;
    const x1pSq = x1p * x1p;
    const y1pSq = y1p * y1p;

    // Ensure radii are large enough
    const lambda = x1pSq / rxSq + y1pSq / rySq;
    if (lambda > 1) {
        const s = Math.sqrt(lambda);
        rx *= s;
        ry *= s;
        rxSq = rx * rx;
        rySq = ry * ry;
    }

    let sq = Math.max(0, (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq));
    sq = Math.sqrt(sq);
    if (largeArc === sweep) sq = -sq;

    const cxp = (sq * rx * y1p) / ry;
    const cyp = (-sq * ry * x1p) / rx;

    // Step 3: Compute (cx, cy) from (cx', cy')
    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

    // Step 4: Compute angles
    const theta1 = vectorAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dtheta = vectorAngle(
        (x1p - cxp) / rx, (y1p - cyp) / ry,
        (-x1p - cxp) / rx, (-y1p - cyp) / ry,
    );

    if (sweep === 0 && dtheta > 0) dtheta -= 2 * Math.PI;
    if (sweep === 1 && dtheta < 0) dtheta += 2 * Math.PI;

    // Split into segments of max π/2
    const segments = Math.ceil(Math.abs(dtheta) / (Math.PI / 2));
    const segAngle = dtheta / segments;
    const curves: number[][] = [];

    for (let i = 0; i < segments; i++) {
        const a1 = theta1 + i * segAngle;
        const a2 = theta1 + (i + 1) * segAngle;
        curves.push(
            ...arcSegmentToBezier(cx, cy, rx, ry, a1, a2, cosPhi, sinPhi),
        );
    }

    return curves;
}

function vectorAngle(ux: number, uy: number, vx: number, vy: number): number {
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
    return sign * Math.acos(Math.max(-1, Math.min(1, dot / len)));
}

function arcSegmentToBezier(
    cx: number, cy: number,
    rx: number, ry: number,
    theta1: number, theta2: number,
    cosPhi: number, sinPhi: number,
): number[][] {
    const alpha = (4 / 3) * Math.tan((theta2 - theta1) / 4);

    const cos1 = Math.cos(theta1);
    const sin1 = Math.sin(theta1);
    const cos2 = Math.cos(theta2);
    const sin2 = Math.sin(theta2);

    // Points in ellipse-local coordinates
    const p1x = rx * cos1;
    const p1y = ry * sin1;
    const p2x = rx * cos2;
    const p2y = ry * sin2;

    const cp1x = p1x - alpha * rx * sin1;
    const cp1y = p1y + alpha * ry * cos1;
    const cp2x = p2x + alpha * rx * sin2;
    const cp2y = p2y - alpha * ry * cos2;

    // Transform back to world coordinates
    return [
        [
            cosPhi * cp1x - sinPhi * cp1y + cx,
            sinPhi * cp1x + cosPhi * cp1y + cy,
            cosPhi * cp2x - sinPhi * cp2y + cx,
            sinPhi * cp2x + cosPhi * cp2y + cy,
            cosPhi * p2x - sinPhi * p2y + cx,
            sinPhi * p2x + cosPhi * p2y + cy,
        ],
    ];
}

/**
 * Parse SVG path data string into THREE.Shape[]
 */
export function parseSVGPathToShapes(d: string): THREE.Shape[] {
    const shapePath = new THREE.ShapePath();

    let x = 0, y = 0; // current point
    let cpx = 0, cpy = 0; // last control point (for S/T smooth curves)
    let startX = 0, startY = 0; // subpath start
    let lastCmd = '';

    const commands = tokenizeSVGPath(d);

    for (const cmd of commands) {
        const type = cmd.type;
        const a = cmd.args;
        const isRel = type === type.toLowerCase();

        switch (type.toUpperCase()) {
            case 'M': {
                x = isRel ? x + a[0] : a[0];
                y = isRel ? y + a[1] : a[1];
                startX = x;
                startY = y;
                shapePath.moveTo(x, y);
                for (let i = 2; i + 1 < a.length; i += 2) {
                    x = isRel ? x + a[i] : a[i];
                    y = isRel ? y + a[i + 1] : a[i + 1];
                    if (shapePath.currentPath) shapePath.currentPath.lineTo(x, y);
                }
                break;
            }
            case 'L': {
                for (let i = 0; i + 1 < a.length; i += 2) {
                    x = isRel ? x + a[i] : a[i];
                    y = isRel ? y + a[i + 1] : a[i + 1];
                    if (shapePath.currentPath) shapePath.currentPath.lineTo(x, y);
                }
                break;
            }
            case 'H': {
                for (let i = 0; i < a.length; i++) {
                    x = isRel ? x + a[i] : a[i];
                    if (shapePath.currentPath) shapePath.currentPath.lineTo(x, y);
                }
                break;
            }
            case 'V': {
                for (let i = 0; i < a.length; i++) {
                    y = isRel ? y + a[i] : a[i];
                    if (shapePath.currentPath) shapePath.currentPath.lineTo(x, y);
                }
                break;
            }
            case 'C': {
                for (let i = 0; i + 5 < a.length; i += 6) {
                    const x1 = isRel ? x + a[i] : a[i];
                    const y1 = isRel ? y + a[i + 1] : a[i + 1];
                    const x2 = isRel ? x + a[i + 2] : a[i + 2];
                    const y2 = isRel ? y + a[i + 3] : a[i + 3];
                    x = isRel ? x + a[i + 4] : a[i + 4];
                    y = isRel ? y + a[i + 5] : a[i + 5];
                    if (shapePath.currentPath) shapePath.currentPath.bezierCurveTo(x1, y1, x2, y2, x, y);
                    cpx = x2;
                    cpy = y2;
                }
                break;
            }
            case 'S': {
                for (let i = 0; i + 3 < a.length; i += 4) {
                    const rx1 = 'CScs'.includes(lastCmd) ? 2 * x - cpx : x;
                    const ry1 = 'CScs'.includes(lastCmd) ? 2 * y - cpy : y;
                    const x2 = isRel ? x + a[i] : a[i];
                    const y2 = isRel ? y + a[i + 1] : a[i + 1];
                    x = isRel ? x + a[i + 2] : a[i + 2];
                    y = isRel ? y + a[i + 3] : a[i + 3];
                    if (shapePath.currentPath) shapePath.currentPath.bezierCurveTo(rx1, ry1, x2, y2, x, y);
                    cpx = x2;
                    cpy = y2;
                }
                break;
            }
            case 'Q': {
                for (let i = 0; i + 3 < a.length; i += 4) {
                    cpx = isRel ? x + a[i] : a[i];
                    cpy = isRel ? y + a[i + 1] : a[i + 1];
                    x = isRel ? x + a[i + 2] : a[i + 2];
                    y = isRel ? y + a[i + 3] : a[i + 3];
                    if (shapePath.currentPath) shapePath.currentPath.quadraticCurveTo(cpx, cpy, x, y);
                }
                break;
            }
            case 'T': {
                for (let i = 0; i + 1 < a.length; i += 2) {
                    cpx = 'QTqt'.includes(lastCmd) ? 2 * x - cpx : x;
                    cpy = 'QTqt'.includes(lastCmd) ? 2 * y - cpy : y;
                    x = isRel ? x + a[i] : a[i];
                    y = isRel ? y + a[i + 1] : a[i + 1];
                    if (shapePath.currentPath) shapePath.currentPath.quadraticCurveTo(cpx, cpy, x, y);
                }
                break;
            }
            case 'A': {
                for (let i = 0; i + 6 < a.length; i += 7) {
                    const arcRx = a[i];
                    const arcRy = a[i + 1];
                    const xRot = (a[i + 2] * Math.PI) / 180;
                    const largeArc = a[i + 3];
                    const sweepFlag = a[i + 4];
                    const endX = isRel ? x + a[i + 5] : a[i + 5];
                    const endY = isRel ? y + a[i + 6] : a[i + 6];

                    const beziers = arcToBeziers(x, y, endX, endY, arcRx, arcRy, xRot, largeArc, sweepFlag);
                    for (const b of beziers) {
                        if (shapePath.currentPath) {
                            shapePath.currentPath.bezierCurveTo(b[0], b[1], b[2], b[3], b[4], b[5]);
                        }
                    }
                    x = endX;
                    y = endY;
                }
                break;
            }
            case 'Z': {
                x = startX;
                y = startY;
                if (shapePath.currentPath) shapePath.currentPath.closePath();
                break;
            }
        }

        // Track last command for smooth continuation
        if (!'CScsQTqt'.includes(type)) {
            cpx = x;
            cpy = y;
        }
        lastCmd = type;
    }

    return shapePath.toShapes(true);
}
