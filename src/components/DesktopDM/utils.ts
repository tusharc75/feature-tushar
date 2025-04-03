import { Chat, User } from 'src/components/DesktopDM/types';

export function checkIsUser(data: User | Chat): data is User {
  return (
    // (data as User)._id !== undefined &&
    (data as User).firstName !== undefined && (data as User).lastName !== undefined
    // && (data as User).concatedName !== undefined &&
    // (data as User).avatar !== undefined
  );
}
