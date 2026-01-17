export class UnauthorizedPackageAccessError extends Error {
  constructor() {
    super('You do not have permission to access this package');
    this.name = 'UnauthorizedPackageAccessError';
  }
}

