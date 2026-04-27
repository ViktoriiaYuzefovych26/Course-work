import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Додали імпорт
import { Observable, tap } from 'rxjs'; // Додали RxJS

export interface SavedReport {
  id?: number;
  createdAt: string;       
  trainNumber: string;
  departureStation: string;
  destinationStation: string;
  departureDate: string;
  dispatcherName: string;   // Перевір, щоб це поле теж тут було!
  wagonType: string;
  wagonCount: number;
  wagonNumbers: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  // Адреса твого Java-контролера
  private apiUrl = 'https://course-bekend.onrender.com/api/sorting/reports';

  constructor(private http: HttpClient) {}

  // 1. Отримуємо всі звіти з БАЗИ ДАНИХ
  getReports(): Observable<SavedReport[]> {
    return this.http.get<SavedReport[]>(`${this.apiUrl}/all`);
  }

  // 2. Зберігаємо звіт у БАЗУ ДАНИХ
  saveReport(report: SavedReport): Observable<SavedReport> {
    return this.http.post<SavedReport>(`${this.apiUrl}/save`, report);
  }
  // Не забудь додати Observable у список імпортів зверху, якщо його там немає
  // import { Observable } from 'rxjs';

  deleteReport(id: number): Observable<void> {
    // Цей рядок каже Angular постукати до Java і видалити запис за ID
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}