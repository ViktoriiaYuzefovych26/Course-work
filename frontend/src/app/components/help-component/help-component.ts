import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-help-component',
  standalone: true,
  imports: [RouterLink], // Обов'язково додаємо для кнопок
  templateUrl: './help-component.html',
  styleUrl: './help-component.css'
})
export class HelpComponent {}