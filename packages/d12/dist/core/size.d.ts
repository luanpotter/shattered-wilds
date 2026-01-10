export declare enum Size {
    F = "Fine",
    D = "Diminutive",
    T = "Tiny",
    S = "Small",
    M = "Medium",
    L = "Large",
    H = "Huge",
    G = "Gargantuan",
    C = "Colossal"
}
export declare class SizeDefinition {
    name: Size;
    hexGridSize: number;
    constructor({ name, hexGridSize }: {
        name: Size;
        hexGridSize: number;
    });
}
export declare const SIZES: Record<Size, SizeDefinition>;
//# sourceMappingURL=size.d.ts.map