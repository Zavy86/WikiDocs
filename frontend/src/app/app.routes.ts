import { Routes } from '@angular/router';
import { AppGuard } from 'src/app/app.guard';
import {
  AccountsComponent,
  AuthenticateComponent,
  DocumentComponent,
  ProfileComponent,
  SearchComponent,
  SettingsComponent,
  TrashComponent,
  WaitComponent
} from 'src/app/components';

export const routes:Routes = [
  { path: 'wait', component: WaitComponent, canActivate: [ AppGuard ], data: { policy: 'public' } },
  { path: 'authenticate', component: AuthenticateComponent, canActivate: [ AppGuard ], data: { policy: 'public' } },
  { path: 'profile', component: ProfileComponent, canActivate: [ AppGuard ], data: { policy: 'authenticated' } },
  { path: 'accounts', component: AccountsComponent, canActivate: [ AppGuard ], data: { policy: 'authorization', authorization: 'manage' } },
  { path: 'settings', component: SettingsComponent, canActivate: [ AppGuard ], data: { policy: 'authorization', authorization: 'manage' } },
  { path: 'search', component: SearchComponent, canActivate: [ AppGuard ], data: { policy: 'authorization', authorization: 'read' } },
  { path: 'trash', component: TrashComponent, canActivate: [ AppGuard ], data: { policy: 'authorization', authorization: 'delete' } },
  { path: '**', component: DocumentComponent, canActivate: [ AppGuard ], data: { policy: 'authorization', authorization: 'read' } },
];
