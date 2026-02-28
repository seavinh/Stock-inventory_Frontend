import { Routes } from '@angular/router';
import { Product } from './product/product';
import { Dashboard } from './dashboard/dashboard';
import { Category } from './category/category';
import { SupplierComponent } from './supplier/supplier';
import { User } from './user/user';
import { Setting } from './setting/setting';
import { Sale } from './sale/sale';
import { Purchases } from './purchases/purchases';
import { Report } from './report/report';
import { Login } from './login/login';
import { Register } from './register/register';
import { adminGuard } from './guards/admin.guard';
import { Profile } from './profile/profile';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'dashboard', component: Dashboard },
    { path: 'product', component: Product },
    { path: 'category', component: Category },
    { path: 'supplier', component: SupplierComponent },
    { path: 'user', component: User, canActivate: [adminGuard] },
    { path: 'profile', component: Profile },
    { path: 'setting', component: Setting },
    { path: 'sale', component: Sale },
    { path: 'purchases', component: Purchases },
    { path: 'report', component: Report },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
];

