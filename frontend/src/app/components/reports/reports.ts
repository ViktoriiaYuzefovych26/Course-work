import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, SavedReport } from './report.service'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class ReportsPage implements OnInit {
  searchQuery: string = ''; 
  filterDate: string = '';
  // Нові змінні для фільтрації та сортування
  sortDirection: 'asc' | 'desc' = 'asc'; // Для дати
  nameSortDirection: 'asc' | 'desc' | 'none' = 'none'; // Для прізвища
  selectedWagonType: string = 'Всі';

  // --- Змінні для фільтрації ---
  wagonTypes: string[] = ['Всі', 'Пасажирський', 'Вантажний', 'Цистерна', 'Платформа'];

// --- Методи для кнопок сортування ---
toggleTimeSort() {
  this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  this.nameSortDirection = 'none'; // Скидаємо алфавітне, коли клацаємо час
}

toggleNameSort() {
  if (this.nameSortDirection === 'none') {
    this.nameSortDirection = 'asc';
  } else if (this.nameSortDirection === 'asc') {
    this.nameSortDirection = 'desc';
  } else {
    this.nameSortDirection = 'none';
  }
}
  
  // Порожній масив, який заповниться з сервісу
  reports: SavedReport[] = [];

  // ТІЛЬКИ ОДИН КОНСТРУКТОР
  constructor(private reportService: ReportService) {}

ngOnInit() {
  this.loadReports();
}

loadReports() {
  this.reportService.getReports().subscribe({
    next: (data) => {
      // Сортуємо за ID (від меншого до більшого)
      // Це гарантує: старі звіти зверху, нові "падають" донизу
      this.reports = data.sort((a, b) =>(b.id || 0)- (a.id || 0));
      
      console.log("Дані відсортовано за порядком створення");
    },
    error: (err: any) => console.error("Помилка:", err)
  });
}
get filteredReports() {
  if (!this.reports) return [];

  // 1. Створюємо копію масиву
  let result = [...this.reports];

  // 2. Фільтр по типу вагона
  if (this.selectedWagonType !== 'Всі') {
    result = result.filter(r => r.wagonType === this.selectedWagonType);
  }

  // 3. Пошук по диспетчеру або номеру
  if (this.searchQuery) {
    const q = this.searchQuery.toLowerCase().trim();
    result = result.filter(r => 
      r.dispatcherName?.toLowerCase().includes(q) || 
      r.trainNumber?.toLowerCase().includes(q)
    );
  }

  // 4. Фільтр по даті календаря
  if (this.filterDate) {
    result = result.filter(r => r.createdAt.includes(this.filterDate));
  }

  // 5. Логіка сортування (Час або Прізвище)
  if (this.nameSortDirection !== 'none') {
    result.sort((a, b) => {
      const res = a.dispatcherName.localeCompare(b.dispatcherName, 'uk');
      return this.nameSortDirection === 'asc' ? res : -res;
    });
  } else {
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return this.sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }

  return result;
}

  clearFilters() {
    this.searchQuery = '';
    this.filterDate = '';
  }

  getTotalWagonsCount(): number {
    return this.filteredReports.reduce((acc, r) => acc + r.wagonCount, 0);
  }

  scrollToTable() {
    document.getElementById('reportsTable')?.scrollIntoView({ behavior: 'smooth' });
  }

  downloadTxt(report: SavedReport) {
    const date = new Date(report.createdAt);
    const dateStr = isNaN(date.getTime()) ? report.createdAt : date.toLocaleString('uk-UA');
    
    let reportContent = `ЗВІТ З АРХІВУ №${report.id}\n`;
    reportContent += `==================================\n`;
    reportContent += `Дата операції: ${dateStr}\n`;
    reportContent += `Маршрут: ${report.departureStation} — ${report.destinationStation}\n`;
    reportContent += `🚆 Номер потяга: ${report.trainNumber}\n`;     
    reportContent += `📅 Дата відправлення: ${report.departureDate}\n`; 
    reportContent += `Диспетчер: ${report.dispatcherName}\n`;
    reportContent += `Статус: ${report.status}\n`;
    reportContent += `Тип вагонів: ${report.wagonType}\n`;
    reportContent += `Кількість: ${report.wagonCount}\n`;
    reportContent += `Номери вагонів: ${report.wagonNumbers}\n`;
    reportContent += `==================================\n`;
    reportContent += `Сгенеровано системою TrainSorty`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Archive_Train_${report.trainNumber}_${report.destinationStation}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  deleteReport(id: number | undefined) {
  if (id === undefined) return;
  
  this.searchQuery = '';
  Swal.fire({
    title: 'Підтвердження видалення',
    text: 'Введіть пароль адміністратора для видалення звіту:',
    input: 'password',
    inputPlaceholder: 'Введіть пароль...',
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off',
      autocomplete: 'new-password',
      name: 'stop-autofill-' + Math.random() // Рандомне ім'я щоразу "плутає" браузер
    },
    showCancelButton: true,
    confirmButtonText: 'Підтвердити',
    cancelButtonText: 'Скасувати',
    confirmButtonColor: '#d33', // Червоний колір для видалення
    showLoaderOnConfirm: true,
    preConfirm: (password) => {
      if (password === 'admin') { // Твій секретний пароль
        return true;
      } else {
        Swal.showValidationMessage('Невірний пароль!');
        return false;
      }
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    // Якщо пароль вірний і натиснуто "Підтвердити"
    if (result.isConfirmed) {
      this.reportService.deleteReport(id).subscribe({
        next: () => {
          this.reports = this.reports.filter(r => r.id !== id);
          Swal.fire('Видалено!', 'Звіт був успішно видалений.', 'success');
        },
        error: (err) => {
          Swal.fire('Помилка!', 'Не вдалося видалити звіт з сервера.', 'error');
        }
      });
    }
  });
}
}

