import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { ReportService } from '../reports/report.service'; // Додайте цей імпорт
import Swal from 'sweetalert2';

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
  trainNumber?: string; // ДОДАНО: Номер потяга
  trainDate?: string;   // ДОДАНО: Дата відправлення
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
  errorMessage: string = '';
  private errorTimeout: any;
  showError: boolean = false;

  isFading: boolean = false; // Додай цю змінну в клас

  triggerError(message: string) {
    // 1. Вбиваємо старий таймер, якщо ти клікнула кнопку кілька разів
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }

    // 2. Встановлюємо нові дані і показуємо блок
    this.errorMessage = message;
    this.showError = true;
    this.cdr.detectChanges(); // Примусово кажемо Angular показати блок

    // 3. Ставимо таймер на 5 секунд (10 для тестування — це занадто довго)
    this.errorTimeout = setTimeout(() => {
      this.showError = false;
      this.errorMessage = '';
      this.cdr.detectChanges(); // Примусово кажемо Angular сховати блок
    }, 5000); 
  }
  // Змінні для маршруту
  departureStation: string = ''; 
  tempDepartureStation: string = ''; // Для модального вікна
  // Дані про поточний рейс
  trainNumber: string = ''; 
  trainDate: string = new Date().toISOString().split('T')[0]; // За замовчуванням сьогоднішня дата

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
    { id: 1, name: 'Київ', allowedType: 1, wagons: [], trainNumber: '', trainDate: '' },
    { id: 2, name: 'Одеса', allowedType: 2, wagons: [], trainNumber: '', trainDate: '' },
    { id: 3, name: 'Миколаїв', allowedType: 3, wagons: [], trainNumber: '', trainDate: '' }
  ];

  // Метод, який перевіряє налаштування і "б'є по руках", якщо їх немає
  checkSetup(event?: Event): boolean {
    if (!this.isSetupComplete) {
      this.triggerError('⚠️ Для початку вкажіть місто відправлення та номер потяга!');
      
      // Якщо це була спроба клікнути на інпут — забираємо з нього курсор
      if (event && event.target) {
        (event.target as HTMLElement).blur();
        event.preventDefault();
      }
      return false;
    }
    return true;
  }

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
  get isSetupComplete(): boolean {
    // Якщо станція є (не undefined і не null) — перевіряємо, чи є там текст без пробілів. 
    // Якщо станції немає — залізно повертаємо false.
    return this.departureStation ? this.departureStation.trim().length > 0 : false;
  }

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone, private reportService: ReportService) {} // Додали сюди

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
    if (!this.checkSetup()) return;
    const num = (this.newWagonNumber || '').toString().trim();

    // ПЕРЕВІРКА НА УНІКАЛЬНІСТЬ
    const isDuplicate = this.incomingTrain.some(w => w.number === num);
    if (isDuplicate) {
      this.triggerError(`Вагон №${num} вже є в черзі!`);
      return;
    }

    if (this.newWagonNumber.length !== 8) {
    this.errorMessage = "Номер має містити 8 цифр!";
    this.showError = true;
    setTimeout(() => {
        this.showError = false;
      }, 10000); // зникне через 3 сек
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

    
    this.incomingTrain = [...this.incomingTrain, { 
      number: num, 
      type: Number(this.newWagonType),
      destination: this.newWagonDestination 
    }];
    
    this.newWagonNumber = '';
    this.newWagonDestination = '';
    this.cdr.detectChanges();
  }

  // --- ФАЙЛИ (JSON + CSV) ---

  triggerFileInput() {
    if (!this.checkSetup()) return; // ДОДАНО: зупиняємо, якщо не налаштовано
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

        // --- ФІЛЬТРАЦІЯ ДУБЛІКАТІВ ПЕРЕД ОБРОБКОЮ ---
        // Ми залишаємо тільки ті об'єкти, номер (id) яких зустрічається вперше
        const uniqueData = rawData.filter((wagon, index, self) =>
          index === self.findIndex((w) => w.id === wagon.id)
        );

        // Передаємо вже очищені дані
        this.processImportedWagons(uniqueData);
        // -------------------------------------------
        
        this.cdr.markForCheck(); 
        this.cdr.detectChanges(); 
      } catch (error) {
        this.importStatus = '❌ Помилка формату файлу';
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }

parseCSV(content: string): any[] {
  const lines = content.split('\n'); // Розбиваємо на рядки
  const result = [];
  
  // Пропускаємо перший рядок, якщо це заголовок (Header)
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    if (currentLine) {
      // Якщо в тебе в CSV просто список номерів (один номер на рядок):
      result.push({ id: currentLine, number: currentLine }); 
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
      this.triggerError('⚠️ Черга порожня, немає що сортувати!');
      return;
    }

    // 2. Перевірка на "червоні" вагони (дуже важливо після імпорту файлів!)
const hasUnassigned = this.incomingTrain.some(w => !w.destination);
if (hasUnassigned) {
  Swal.fire({
    icon: 'error',
    title: 'Сортування неможливе',
    text: 'Оберіть напрямки для всіх червоних (нерозподілених) вагонів!',
    confirmButtonColor: '#d33'
  });
  return;
}

    // Якщо все ок - починаємо
    this.isSortingFinished = false;
    this.sortingInProgress = true;
    this.importStatus = ''; // Прибираємо старі текстові статуси
    this.cdr.detectChanges(); // ПРИМУСОВИЙ рефреш екрану

    const interval = setInterval(() => {
      if (this.incomingTrain.length > 0) {
        const currentWagon = this.incomingTrain[0];
        
        // Шукаємо колію
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
          // Якщо колія зникла
          clearInterval(interval);
          this.sortingInProgress = false;
          this.triggerError(`❌ Помилка: Немає колії для напрямку ${currentWagon.destination}`);
          this.cdr.detectChanges();
          return;
        }
        
        this.cdr.detectChanges(); // Оновлюємо екран після кожного вагона
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
  const dateStr = new Date().toLocaleString('uk-UA');
  const now = new Date().toISOString(); // Для бази даних
  
  // 1. Формуємо текстовий звіт для файлу (твій існуючий код)
  let reportText = `==================================\n`;
  reportText += `     ЗВІТ СИСТЕМИ TRAINSORTY\n`;
  reportText += `==================================\n`;
  reportText += `МАРШРУТ: ${this.departureStation?.toUpperCase() || 'НЕВІДОМА СТАНЦІЯ'} — РОЗФОРМУВАННЯ\n`;
  reportText += `Дата генерації: ${dateStr}\n`;
  reportText += `Диспетчер: ${this.reportData.dispatcherName}\n\n`;

  // 2. Логіка для БАЗИ ДАНИХ та ТЕКСТУ
  this.tracks.forEach(track => {
    if (track.wagons.length > 0) {
      // Додаємо в текст для файлу
      reportText += `📍 НАПРЯМОК: ${this.departureStation} — ${track.name}\n`;
      reportText += `   🚆 Номер потяга: ${track.trainNumber || 'Б/Н'}\n`;
      reportText += `   📅 Дата відправлення: ${track.trainDate || '-'}\n`;
      reportText += `   Кількість вагонів: ${track.wagons.length}\n`;
      reportText += `   Номери: ${track.wagons.map(w => w.number).join(', ')}\n\n`;

      // --- ВІДПРАВЛЯЄМО В JAVA BACKEND ---
      const reportForDb = {
        trainNumber: track.trainNumber || 'Б/Н',
        departureStation: this.departureStation || 'Невідома',
        destinationStation: track.name,
        departureDate: track.trainDate || dateStr,
        createdAt: now,
        dispatcherName: this.reportData.dispatcherName,
        wagonCount: track.wagons.length,
        wagonNumbers: track.wagons.map(w => w.number).join(', '),
        wagonType: this.getTypeName(track.allowedType),
        status: 'Сформовано'
      };

      // САМЕ ЦЕЙ ВИКЛИК ЗБЕРІГАЄ В БАЗУ
this.reportService.saveReport(reportForDb).subscribe({
  next: (res) => {
    console.log('Звіт збережено в БД');
    // Можна додати маленьке повідомлення після завантаження файлу
    Swal.fire({
      icon: 'success',
      title: 'Готово!',
      text: 'Звіти збережені в базі та завантажені на ПК',
      timer: 3000,
      showConfirmButton: false
    });
  },
  error: (err) => {
    Swal.fire({
      icon: 'error',
      title: 'Помилка бази даних',
      text: 'Файл завантажено, але в базу дані не потрапили.'
    });
  }
});
    }
  });

  // 3. Завантаження файлу (як і було)
  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Zvit_Dispatch_${new Date().getTime()}.txt`;
  a.click();
  
  this.showReportForm = false;
  this.cdr.detectChanges(); 
}

  // Метод для ручного вибору напрямку для вагона в черзі
async selectDestinationForWagon(index: number) {
  const wagon = this.incomingTrain[index];
  
  // Отримуємо список міст
  const possibleCities = this.tracks
    .filter(t => Number(t.allowedType) === Number(wagon.type))
    .map(t => t.name);

  if (possibleCities.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Увага',
      text: 'Налаштуйте колію для цього типу вагона в налаштуваннях!',
      confirmButtonColor: '#3085d6'
    });
    return;
  }

  // Створюємо об'єкт варіантів для SweetAlert
  const cityOptions: { [key: string]: string } = {};
  possibleCities.forEach(city => {
    cityOptions[city] = city;
  });

  const { value: selectedCity } = await Swal.fire({
    title: 'Призначення маршруту',
    text: `Куди відправити вагон №${wagon.number}?`,
    input: 'select',
    inputOptions: cityOptions,
    inputPlaceholder: 'Оберіть місто',
    showCancelButton: true,
    confirmButtonText: 'Призначити',
    cancelButtonText: 'Скасувати',
    confirmButtonColor: '#28a745',
    inputValidator: (value) => {
      return new Promise((resolve) => {
        if (value) resolve();
        else resolve('Ви повинні обрати напрямок!');
      });
    }
  });

  if (selectedCity) {
    this.incomingTrain[index].destination = selectedCity;
    this.cdr.detectChanges();
    
    // Маленьке сповіщення про успіх
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
    Toast.fire({
      icon: 'success',
      title: `Вагон №${wagon.number} -> ${selectedCity}`
    });
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
    this.tempTracks.push({ 
      id: newId, 
      name: 'Нова станція', 
      allowedType: 1, 
      wagons: [],
      trainNumber: '', // ДОДАНО
      trainDate: ''    // ДОДАНО
    });
  }

  removeTrack(index: number) {
    if (this.tempTracks.length <= 2) return;
    this.tempTracks.splice(index, 1);
  }

  removeWagon(index: number) {
    // Видаляємо 1 елемент за вказаним індексом
    this.incomingTrain.splice(index, 1);
    this.cdr.detectChanges(); // Оновлюємо екран
  }

  saveSettings() {
    this.departureStation = this.tempDepartureStation; // Зберігаємо нове місто
    this.tracks = JSON.parse(JSON.stringify(this.tempTracks));
    this.tracks.forEach(t => t.wagons = []); 
    this.isSettingsOpen = false;
    this.cdr.detectChanges();
  }
}