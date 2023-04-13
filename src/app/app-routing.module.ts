import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InitComponent } from './components/init/init.component';
import { LoginComponent } from './components/auth/login/login.component';
import { LogoutComponent } from './components/auth/logout/logout.component';
import { PageNotFoundComponent } from './components/shared/page-not-found/page-not-found.component';
import { AuthGuard } from './guards/auth.guard';
import { ApplicationComponent } from './components/application/application.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RedefinePasswordComponent } from './components/auth/redefine-password/redefine-password.component';
import { AuthenticateComponent } from './components/auth/authenticate/authenticate.component';
import { UnderMaintenanceComponent } from './components/shared/under-maintenance/under-maintenance.component';
import { ConfirmEmailComponent } from './components/auth/confirm-email/confirm-email.component';
import { PlaidTokenLinkComponent } from './components/dashboard/plaid-token-link/plaid-token-link.component';
import { OptOutEmailComponent } from './components/auth/opt-out-email/opt-out-email.component';

const appRoutes: Routes = [
    { path: '', component: InitComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'logout', component: LogoutComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'redefine-password', component: RedefinePasswordComponent },
    { path: 'authenticate', component: AuthenticateComponent },
    { path: 'confirm-email', component: ConfirmEmailComponent },
    { path: 'opt-out-email', component: OptOutEmailComponent, canActivate: [AuthGuard] },
    { path: 'bank-verification', component: PlaidTokenLinkComponent },
    {
        path: 'application',
        component: ApplicationComponent,
        canActivate: [AuthGuard],
        loadChildren: () => import('./components/application/application.module').then(m => m.ApplicationModule)
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard],
        loadChildren: () => import('./components/dashboard/dashboard.module').then(m => m.DashboardModule)
    },
    { path: 'under-maintenance', component: UnderMaintenanceComponent },
    { path: 'not-found', component: PageNotFoundComponent },
    { path: '**', redirectTo: '/not-found' }
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {

}
