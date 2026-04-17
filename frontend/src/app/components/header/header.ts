import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // 1. Додали імпорт з Angular Router

@Component({
  selector: 'app-header',
  standalone: true, // На всякий випадок явно вказуємо, що це standalone
  imports: [RouterLink, RouterLinkActive], // 2. Додали інструменти в масив imports
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  
}