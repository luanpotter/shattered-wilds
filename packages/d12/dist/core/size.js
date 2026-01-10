export var Size;
(function (Size) {
    Size["F"] = "Fine";
    Size["D"] = "Diminutive";
    Size["T"] = "Tiny";
    Size["S"] = "Small";
    Size["M"] = "Medium";
    Size["L"] = "Large";
    Size["H"] = "Huge";
    Size["G"] = "Gargantuan";
    Size["C"] = "Colossal";
})(Size || (Size = {}));
export class SizeDefinition {
    name;
    hexGridSize;
    constructor({ name, hexGridSize }) {
        this.name = name;
        this.hexGridSize = hexGridSize;
    }
}
export const SIZES = {
    [Size.F]: new SizeDefinition({ name: Size.F, hexGridSize: 1 }),
    [Size.D]: new SizeDefinition({ name: Size.D, hexGridSize: 1 }),
    [Size.T]: new SizeDefinition({ name: Size.T, hexGridSize: 1 }),
    [Size.S]: new SizeDefinition({ name: Size.S, hexGridSize: 1 }),
    [Size.M]: new SizeDefinition({ name: Size.M, hexGridSize: 1 }),
    [Size.L]: new SizeDefinition({ name: Size.L, hexGridSize: 1 }),
    [Size.H]: new SizeDefinition({ name: Size.H, hexGridSize: 3 }),
    [Size.G]: new SizeDefinition({ name: Size.G, hexGridSize: 4 }),
    [Size.C]: new SizeDefinition({ name: Size.C, hexGridSize: 7 }),
};
//# sourceMappingURL=size.js.map