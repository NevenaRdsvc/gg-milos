import {
  Routes
} from '@angular/router';

export const routes: Routes = [{
    path: 'home',
    loadComponent: () => import('./home/home.component').then(c => c.HomeComponent),
  },
  {
    path: 'game',
    loadComponent: () => import('./game-page/game-page.component').then(c => c.GamePageComponent),
  },


  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  }
];
