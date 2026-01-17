export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenGeneratorPort {
  generate(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<TokenPayload>;
}

