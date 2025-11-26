export interface Supadmin {
  id?: number;
  username: string;
  password: string;
}

export interface SupadminWithoutPassword {
  id?: number;
  username: string;
}