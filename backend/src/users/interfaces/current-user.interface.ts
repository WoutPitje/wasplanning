import { UserRole } from '../../auth/entities/user.entity';

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  tenant: {
    id: string;
    name: string;
    display_name: string;
  };
}
