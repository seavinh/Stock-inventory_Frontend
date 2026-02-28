import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Userservice } from '../services/userservice';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
    const userService = inject(Userservice);
    const token = userService.getToken();

    if (token) {
        const authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
        return next(authReq);
    }

    return next(req);
};
