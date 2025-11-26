export interface Adminuser {
  id?: number;
  username: string;
  password: string;
}

export interface AdminuserWithoutPassword {
  id?: number;
  username: string;
}