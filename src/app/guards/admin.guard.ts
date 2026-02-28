import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Userservice } from '../services/userservice';

export const adminGuard: CanActivateFn = () => {
    const userService = inject(Userservice);
    const router = inject(Router);

    if (userService.isAdmin()) {
        return true;
    }

    // Redirect non-admins to dashboard
    router.navigate(['/dashboard']);
    return false;
};
