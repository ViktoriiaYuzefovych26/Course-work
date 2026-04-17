import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  selectedReport: any = null;

  // Тимчасові дані для перевірки дизайну
  reports = [
    { 
      id: 1, 
      reportDate: new Date(), 
      departureStation: 'Львів', 
      destinationStation: 'Київ', 
      dispatcherName: 'Юзефович М-В.', 
      wagonType: 'Пасажирський', 
      wagonCount: 12, 
      wagonNumbers: '12345678, 87654321, 11223344' 
    },
    { 
      id: 2, 
      reportDate: new Date(Date.now() - 86400000), 
      departureStation: 'Львів', 
      destinationStation: 'Одеса', 
      dispatcherName: 'Юзефович М-В.', 
      wagonType: 'Цистерна', 
      wagonCount: 5, 
      wagonNumbers: '77665544, 99001122' 
    }
  ];

  constructor() {}

  ngOnInit() {}

  // Геттер для фільтрації таблиці
  get filteredReports() {
    if (!this.reports) return [];
    return this.reports.filter(r => 
      r.dispatcherName.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // Метод для статистики (сума всіх вагонів)
  getTotalWagonsCount(): number {
    return this.reports.reduce((acc, r) => acc + r.wagonCount, 0);
  }

  // Плавний скрол до таблиці
  scrollToTable() {
    document.getElementById('reportsTable')?.scrollIntoView({ behavior: 'smooth' });
  }

  // РЕАЛЬНА ЛОГІКА ЗАВАНТАЖЕННЯ ЗВІТУ
  downloadTxt(report: any) {
    const dateStr = new Date(report.reportDate).toLocaleString('uk-UA');
    let reportContent = `ЗВІТ З АРХІВУ №${report.id}\n`;
    reportContent += `==================================\n`;
    reportContent += `Дата операції: ${dateStr}\n`;
    reportContent += `Маршрут: ${report.departureStation} — ${report.destinationStation}\n`;
    reportContent += `Диспетчер: ${report.dispatcherName}\n`;
    reportContent += `Тип вагонів: ${report.wagonType}\n`;
    reportContent += `Кількість: ${report.wagonCount}\n`;
    reportContent += `Номери вагонів: ${report.wagonNumbers}\n`;
    reportContent += `==================================\n`;
    reportContent += `Сгенеровано системою TrainSorty`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_Archive_${report.id}_${report.destinationStation}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}