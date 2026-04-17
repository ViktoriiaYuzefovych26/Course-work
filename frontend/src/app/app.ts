import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { SortingPage } from './components/sorting-page/sorting-page';
import { HomeComponent } from './components/home/home'; // Додай імпорт сюди

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, // Це обов'язково для роботи вікна сторінок
    Header,
    Footer,
    SortingPage,
    HomeComponent // Додай сюди
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'frontend';
}