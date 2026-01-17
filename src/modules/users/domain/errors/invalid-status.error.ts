export class InvalidStatusError extends Error {
  constructor(status: string) {
    super(`Invalid status: ${status}. Must be ACTIVE, INACTIVE or BLOCKED`);
    this.name = 'InvalidStatusError';
  }
}

