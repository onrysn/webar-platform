export class ManageUserDto {
  userId: number;
  role?: 'admin' | 'editor' | 'member';
}