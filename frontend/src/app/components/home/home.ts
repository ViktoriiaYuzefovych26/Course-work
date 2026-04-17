import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink], // Обов'язково додаємо для кнопок
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent {}