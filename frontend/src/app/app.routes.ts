import { Routes } from '@angular/router';
import { SortingPage } from './components/sorting-page/sorting-page';
import { HomeComponent } from './components/home/home'; // Додай цей імпорт

export const routes: Routes = [
  // Тепер /home відкриває Головну
  { path: 'home', component: HomeComponent }, 
  
  // /sorting відкриває Сортування
  { path: 'sorting', component: SortingPage },
  
  // Коли відкриваєш сайт вперше, нехай кидає на Головну
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];