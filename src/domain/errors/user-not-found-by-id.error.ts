export class UserNotFoundByIdError extends Error {
  constructor(id: string) {
    super(`User with id ${id} not found`);
    this.name = 'UserNotFoundByIdError';
  }
}

