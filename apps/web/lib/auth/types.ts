export type UserRoleName = "USER" | "ADMIN";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRoleName;
};

export type SessionPayload = {
  userId: string;
  role: UserRoleName;
  exp: number;
};
