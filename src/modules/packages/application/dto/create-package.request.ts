export interface PackageDimensionsRequest {
  length: number;
  width: number;
  height: number;
}

export interface CreatePackageRequest {
  origin: string;
  destination: string;
  weight: number;
  dimensions: PackageDimensionsRequest;
}

