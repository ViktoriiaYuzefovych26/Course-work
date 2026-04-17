import { Routes } from '@angular/router';
import { SortingPage } from './components/sorting-page/sorting-page';
import { HomeComponent } from './components/home/home';
import { HelpComponent } from './components/help-component/help-component';
import { ReportsPage } from './components/reports/reports';

  

export const routes: Routes = [

  { path: 'home', component: HomeComponent }, 
  { path: 'sorting', component: SortingPage },
  { path: 'reports', component: ReportsPage },
  { path: 'help', component: HelpComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];