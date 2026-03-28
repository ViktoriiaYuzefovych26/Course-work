import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { SortingPage } from './components/sorting-page/sorting-page';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Header,
    Footer,
    SortingPage
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
// ОСЬ ЦЯ ЗМІНА: App замість AppComponent
export class App {
  title = 'frontend';
}