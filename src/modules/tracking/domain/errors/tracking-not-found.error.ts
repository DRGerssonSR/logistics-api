export class TrackingNotFoundError extends Error {
  constructor(packageId: string) {
    super(`No tracking events found for package ${packageId}`);
    this.name = 'TrackingNotFoundError';
  }
}

