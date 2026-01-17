import { UserRole } from '../value-objects/user-role.vo';

export interface UserProps {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserProps = Pick<UserProps, 'email' | 'password' | 'name' | 'role'>;

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly password: string;
  public readonly name: string;
  public readonly role: UserRole;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
    this.name = props.name;
    this.role = props.role;
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
      createdAt: now,
      updatedAt: now,
    });
  }
}

