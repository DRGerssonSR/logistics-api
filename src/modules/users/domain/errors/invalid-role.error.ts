export class InvalidRoleError extends Error {
  constructor(role: string) {
    super(`Invalid role: ${role}. Must be ADMIN or USER`);
    this.name = 'InvalidRoleError';
  }
}

