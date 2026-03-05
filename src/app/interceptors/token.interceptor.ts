import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Userservice } from '../services/userservice';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import Swal from 'sweetalert2';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
    // Skip adding token for local assets (like translation files)
    if (req.url.includes('/assets/')) {
        return next(req);
    }

    const userService = inject(Userservice);
    const router = inject(Router);
    const token = userService.getToken();

    let handledReq = req;

    if (token) {
        handledReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    return next(handledReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Dynamic login/session management
            // Ensure we don't interfere with the actual login API call
            if ((error.status === 401 || error.status === 403) && !req.url.includes('/login')) {
                // Determine if it was specifically a deactivation 
                const isDeactivated = error.error?.message?.includes('disabled');

                userService.logout();
                router.navigate(['/login']);

                if (isDeactivated) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Account Disabled',
                        text: 'Your account has been deactivated by the administrator.'
                    });
                } else if (error.status === 401) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Session Expired',
                        text: 'Your session has expired. Please log in again.'
                    });
                }
            }
            return throwError(() => error);
        })
    );
};
