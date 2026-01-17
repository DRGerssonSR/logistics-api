export class PackageNotFoundError extends Error {
  constructor(id: string) {
    super(`Package with id ${id} not found`);
    this.name = 'PackageNotFoundError';
  }
}

