export interface Point {
    x: number;
    y: number;
}

export interface SelectionBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export function isIntersecting(box: Rect, item: DOMRect): boolean {
    return !(
        box.right < item.left ||
        box.left > item.right ||
        box.bottom < item.top ||
        box.top > item.bottom
    );
}

export function calculateBox(start: Point, current: Point): SelectionBox {
    return {
        x: Math.min(start.x, current.x),
        y: Math.min(start.y, current.y),
        width: Math.abs(current.x - start.x),
        height: Math.abs(current.y - start.y)
    };
}
