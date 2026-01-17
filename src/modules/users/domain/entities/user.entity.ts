import { UserRole } from '../value-objects/user-role.vo';
import { UserStatus } from '../value-objects/user-status.vo';

export interface UserProps {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserProps = Pick<UserProps, 'email' | 'password' | 'name' | 'role'> & {
  status?: UserStatus;
};

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly password: string;
  public readonly name: string;
  public readonly role: UserRole;
  public readonly status: UserStatus;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
    this.name = props.name;
    this.role = props.role;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateUserProps): User {
    const now = new Date();
    return new User({
      id: crypto.randomUUID(),
      email: props.email,
      password: props.password,
      name: props.name,
      role: props.role,
      status: props.status || UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
  }
}

