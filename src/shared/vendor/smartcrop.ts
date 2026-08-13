import * as smartcropCjs from './smartcrop.cjs';

export type Crop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CropResult = {
  topCrop: Crop;
};

export type CropOptions = {
  width: number;
  height: number;
  minScale?: number;
  ruleOfThirds?: boolean;
};

export type Smartcrop = {
  crop(image: CanvasImageSource, options: CropOptions): Promise<CropResult>;
};

const fromModule = (smartcropCjs as unknown as { default?: Smartcrop }).default;
const fromGlobal = (globalThis as unknown as { smartcrop?: Smartcrop }).smartcrop;

const smartcrop = (fromModule ?? fromGlobal) as Smartcrop;

export default smartcrop;
