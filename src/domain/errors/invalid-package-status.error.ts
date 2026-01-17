export class InvalidPackageStatusError extends Error {
  constructor(status: string) {
    super(
      `Invalid package status: ${status}. Must be PENDING, IN_TRANSIT or DELIVERED`,
    );
    this.name = 'InvalidPackageStatusError';
  }
}

