export class InvalidStatusTransitionError extends Error {
  constructor(currentStatus: string, newStatus: string) {
    super(
      `Invalid status transition from ${currentStatus} to ${newStatus}`,
    );
    this.name = 'InvalidStatusTransitionError';
  }
}

