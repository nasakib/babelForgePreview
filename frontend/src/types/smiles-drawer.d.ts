declare module "smiles-drawer" {
  export class Drawer {
    constructor(options: any);
    draw(tree: any, target: HTMLCanvasElement, theme: string, weights?: boolean): void;
  }
  export function parse(
    smiles: string,
    successCallback: (tree: any) => void,
    errorCallback: (err: any) => void
  ): void;
}
