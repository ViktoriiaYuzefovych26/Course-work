import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';

export interface Wagon {
  number: string;
  type: number; 
  destination: string; 
}

export interface Track {
  id: number;
  name: string;
  allowedType: number; 
  wagons: Wagon[];
}

@Component({
  selector: 'app-sorting-page',
  standalone: true,
  imports: [FormsModule, CommonModule], 
  templateUrl: './sorting-page.html',
  styleUrl: './sorting-page.css'
})
export class SortingPage {
  incomingTrain: Wagon[] = [];
  
  // Дані для форми
  newWagonNumber: string = '';
  newWagonType: number = 1;
  newWagonDestination: string = '';
  importStatus: string = '';
  
  // Змінні для маршруту
  departureStation: string = ''; 
  tempDepartureStation: string = ''; // Для модального вікна

  // Список типів вагонів (згідно зі стандартами УЗ)
  wagonTypes = [
    { id: 1, name: 'Пасажирський' },
    { id: 2, name: 'Вантажний' },
    { id: 3, name: 'Цистерна' },
    { id: 4, name: 'Контейнерний' },
    { id: 5, name: 'Технічний' }
  ];

  // Початкові колії
  tracks: Track[] = [
    { id: 1, name: 'Київ', allowedType: 1, wagons: [] },
    { id: 2, name: 'Одеса', allowedType: 2, wagons: [] },
    { id: 3, name: 'Миколаїв', allowedType: 3, wagons: [] }
  ];

  sortingInProgress = false;
  isSettingsOpen = false;
  tempTracks: Track[] = []; 

  isSortingFinished = false;
  showReportForm = false;
  
  reportData = {
    dispatcherName: 'Юзефович Марія-Вікторія',
    shiftNumber: '',
    stationMaster: '',
    notes: ''
  };

  constructor(private cdr: ChangeDetectorRef) {}

  // --- ЛОГІКА РОЗПІЗНАВАННЯ ТА ВАЛІДАЦІЇ ---

  getAvailableTypes() {
    const activeTypeIds = this.tracks.map(t => Number(t.allowedType));
    return this.wagonTypes.filter(type => activeTypeIds.includes(type.id));
  }

  onNumberChange() {
    if (this.newWagonNumber.length > 0) {
      const firstDigit = this.newWagonNumber[0];
      let detectedType: number | null = null;

      if (['1', '0'].includes(firstDigit)) detectedType = 1;
      else if (['2', '3', '5', '6'].includes(firstDigit)) detectedType = 2;
      else if (firstDigit === '7') detectedType = 3;
      else if (firstDigit === '4') detectedType = 4;
      else if (['8', '9'].includes(firstDigit)) detectedType = 5;

      if (detectedType) {
        const isTrackAvailable = this.tracks.some(t => Number(t.allowedType) === detectedType);
        if (isTrackAvailable) {
          this.newWagonType = detectedType;
        }
      }
    }
  }

  getAvailableFirstDigits(): string {
    const activeIds = this.tracks.map(t => Number(t.allowedType));
    const digits: string[] = [];
    if (activeIds.includes(1)) digits.push('0, 1');
    if (activeIds.includes(2)) digits.push('2, 3, 5, 6');
    if (activeIds.includes(3)) digits.push('7');
    if (activeIds.includes(4)) digits.push('4');
    if (activeIds.includes(5)) digits.push('8, 9');
    return digits.length > 0 ? digits.join(' | ') : 'маршрути відсутні';
  }

  isCurrentNumberValid(): boolean {
    if (!this.newWagonNumber) return true;
    const firstDigit = this.newWagonNumber[0];
    let detectedType = 0;
    if (['1', '0'].includes(firstDigit)) detectedType = 1;
    else if (['2', '3', '5', '6'].includes(firstDigit)) detectedType = 2;
    else if (firstDigit === '7') detectedType = 3;
    else if (firstDigit === '4') detectedType = 4;
    else if (['8', '9'].includes(firstDigit)) detectedType = 5;

    return this.tracks.some(t => Number(t.allowedType) === detectedType);
  }

  getPossibleDestinations(): string[] {
    const type = Number(this.newWagonType);
    return this.tracks
      .filter(t => Number(t.allowedType) === type)
      .map(t => t.name);
  }

  addWagon() {
    const num = this.newWagonNumber.trim();
    if (!/^\d{8}$/.test(num)) {
      alert('Номер має містити 8 цифр!');
      return;
    }

    const possibleCities = this.getPossibleDestinations();
    if (possibleCities.length === 1) {
      this.newWagonDestination = possibleCities[0];
    }

    if (possibleCities.length > 1 && !this.newWagonDestination) {
      alert('Оберіть конкретний напрямок!');
      return;
    }

    this.incomingTrain.push({ 
      number: num, 
      type: Number(this.newWagonType),
      destination: this.newWagonDestination 
    });
    
    this.newWagonNumber = '';
    this.newWagonDestination = '';
    this.cdr.detectChanges();
  }

  // --- ФАЙЛИ (JSON + CSV) ---

  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLElement;
    fileInput.click();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    reader.onload = (e: any) => {
      const content = e.target.result;
      let rawData: any[] = [];
      try {
        if (fileName.endsWith('.json')) {
          rawData = JSON.parse(content);
        } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
          rawData = this.parseCSV(content);
        }
        this.processImportedWagons(rawData);
        
        // ДОДАЙ ЦЕ: примусове оновлення статусу
        this.cdr.markForCheck(); 
        this.cdr.detectChanges(); 
      } catch (error) {
        this.importStatus = '❌ Помилка формату файлу';
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  parseCSV(text: string): any[] {
    const lines = text.split('\n');
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length >= 1) {
        result.push({ number: cols[0].trim() });
      }
    }
    return result;
  }

  processImportedWagons(data: any[]) {
  let added = 0;
  let ignored = 0; // Лічильник вагонів без маршруту
  const newWagons: Wagon[] = [];

  data.forEach(item => {
    const num = item.number?.toString().trim();
    if (num && /^\d{8}$/.test(num)) {
      const firstDigit = num[0];
      let detectedType = 0;
      
      // Логіка визначення типу за першою цифрою
      if (['1', '0'].includes(firstDigit)) detectedType = 1;
      else if (['2', '3', '5', '6'].includes(firstDigit)) detectedType = 2;
      else if (firstDigit === '7') detectedType = 3;
      else if (firstDigit === '4') detectedType = 4;
      else if (['8', '9'].includes(firstDigit)) detectedType = 5;

      // ПЕРЕВІРКА: чи є хоча б одна колія для цього типу
      const possibleDestinations = this.tracks
        .filter(t => Number(t.allowedType) === detectedType)
        .map(t => t.name);

      if (possibleDestinations.length > 0) {
        // Якщо маршрут є — додаємо
        newWagons.push({
          number: num,
          type: detectedType,
          destination: possibleDestinations.length === 1 ? possibleDestinations[0] : ''
        });
        added++;
      } else {
        // Якщо маршруту немає — ігноруємо
        ignored++;
      }
    }
  });

  this.incomingTrain = [...this.incomingTrain, ...newWagons];
  
  // Оновлюємо статус, щоб диспетчер знав, чому деякі вагони не з'явилися
  if (ignored > 0) {
    this.importStatus = `✅ Додано: ${added}. ⚠️ Пропущено: ${ignored} (немає маршрутів)`;
  } else {
    this.importStatus = `✅ Успішно додано вагонів: ${added}`;
  }

  setTimeout(() => this.importStatus = '', 4000);
  this.cdr.detectChanges();
}

  // --- СОРТУВАННЯ ---

  startSorting() {
    // 1. Перевірка на порожнечу
    if (!this.incomingTrain || this.incomingTrain.length === 0) {
      this.importStatus = '⚠️ Черга порожня!';
      return;
    }

    // 2. Перевірка на "червоні" вагони
    const hasUnassigned = this.incomingTrain.some(w => !w.destination);
    if (hasUnassigned) {
      this.importStatus = '⚠️ Оберіть напрямки для червоних вагонів!';
      return;
    }

    // Скидаємо прапорці перед початком
    this.isSortingFinished = false;
    this.sortingInProgress = true;
    this.cdr.detectChanges();

    const interval = setInterval(() => {
      if (this.incomingTrain.length > 0) {
        const currentWagon = this.incomingTrain[0];
        
        // Шукаємо колію ТІЛЬКИ в основному масиві tracks
        const targetTrack = this.tracks.find(t => 
          Number(t.allowedType) === Number(currentWagon.type) && 
          t.name === currentWagon.destination
        );

        if (targetTrack) {
          // Додаємо вагон на колію
          targetTrack.wagons = [...targetTrack.wagons, currentWagon];
          // Видаляємо з черги
          this.incomingTrain = this.incomingTrain.slice(1);
        } else {
          clearInterval(interval);
          this.sortingInProgress = false;
          this.importStatus = `❌ Немає колії для ${currentWagon.destination}`;
          return;
        }
        this.cdr.detectChanges();
      } else {
        clearInterval(interval);
        this.finishSorting();
      }
    }, 500);
  }

  finishSorting() {
    this.sortingInProgress = false;
    this.isSortingFinished = true;
    this.cdr.detectChanges();
  }

  // --- ЗВІТНІСТЬ ---

  onAcceptReport() {
    this.showReportForm = true;
    this.isSortingFinished = false;
  }

  onDeclineReport() {
    this.isSortingFinished = false;
    this.showReportForm = false;
  }

  generateReport() {
    const date = new Date().toLocaleString('uk-UA');
    let report = `==================================\n`;
    report += `  ЗВІТ СИСТЕМИ TRAINSORTY\n`;
    report += `==================================\n`;
    report += `МАРШРУТ: ${this.departureStation.toUpperCase()} — РІЗНІ НАПРЯМКИ\n`;
    report += `Дата: ${date}\n`;
    report += `Диспетчер: ${this.reportData.dispatcherName}\n`;
    report += `Зміна: ${this.reportData.shiftNumber}\n`;
    report += `----------------------------------\n\n`;
    
    this.tracks.forEach(track => {
      if (track.wagons.length > 0) {
        report += `📍 НАПРЯМОК: ${this.departureStation} — ${track.name}\n`;
        report += `   Тип: ${this.getTypeName(track.allowedType)}\n`;
        report += `   Кількість: ${track.wagons.length}\n`;
        report += `   Номери: ${track.wagons.map(w => w.number).join(', ')}\n\n`;
      }
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Zvit_${this.departureStation}_${new Date().getTime()}.txt`;
    a.click();
    
    this.showReportForm = false;
    this.cdr.detectChanges(); 
  }

  // Метод для ручного вибору напрямку для вагона в черзі
selectDestinationForWagon(index: number) {
  const wagon = this.incomingTrain[index];
  
  // Отримуємо список міст, які підходять під ТИП цього вагона
  const possibleCities = this.tracks
    .filter(t => Number(t.allowedType) === Number(wagon.type))
    .map(t => t.name);

  if (possibleCities.length === 0) {
    this.importStatus = '⚠️ Налаштуйте колію для цього типу вагона!';
    return;
  }

  // Створюємо просте вікно вибору
  const choice = prompt(
    `Оберіть напрямок для вагона ${wagon.number}:\n` + 
    possibleCities.map((city, i) => `${i + 1}. ${city}`).join('\n')
  );

  if (choice) {
    const selectedIndex = parseInt(choice) - 1;
    if (possibleCities[selectedIndex]) {
      this.incomingTrain[index].destination = possibleCities[selectedIndex];
      this.importStatus = `✅ Вагону ${wagon.number} призначено: ${possibleCities[selectedIndex]}`;
      setTimeout(() => this.importStatus = '', 3000);
      this.cdr.detectChanges();
    }
  }
}
  // --- НАЛАШТУВАННЯ ---

  getTypeName(id: number): string {
    const type = this.wagonTypes.find(t => t.id === Number(id));
    return type ? type.name : 'Невідомий';
  }

  openSettings() {
    this.tempTracks = JSON.parse(JSON.stringify(this.tracks));
    this.tempDepartureStation = this.departureStation; // Копіюємо для редагування
    this.isSettingsOpen = true;
  }

  closeSettings() {
    this.isSettingsOpen = false;
  }

  addNewTrack() {
    if (this.tempTracks.length >= 5) return;
    const newId = Date.now();
    this.tempTracks.push({ id: newId, name: 'Нова станція', allowedType: 1, wagons: [] });
  }

  removeTrack(index: number) {
    if (this.tempTracks.length <= 2) return;
    this.tempTracks.splice(index, 1);
  }

  saveSettings() {
    this.departureStation = this.tempDepartureStation; // Зберігаємо нове місто
    this.tracks = JSON.parse(JSON.stringify(this.tempTracks));
    this.tracks.forEach(t => t.wagons = []); 
    this.isSettingsOpen = false;
    this.cdr.detectChanges();
  }
}