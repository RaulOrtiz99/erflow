export interface User{
  id : string;
  email: string;
  full_name: string;
  created_at: Date;
  last_sign_in: Date;
  avatar_url?: string;

}

export interface UserCredentials{
  email: string;
  password: string;
}
