import { Component, ChangeDetectorRef } from '@angular/core';
// 1. ІМПОРТУЄМО МОДУЛЬ ДЛЯ ПОЛІВ ВВОДУ:
import { FormsModule } from '@angular/forms'; 

export interface Wagon {
  number: string;
}

export interface Track {
  id: number;
  name: string;
  wagons: Wagon[];
}

@Component({
  selector: 'app-sorting-page',
  standalone: true,
  // 2. ДОДАЄМО FormsModule СЮДИ:
  imports: [FormsModule], 
  templateUrl: './sorting-page.html',
  styleUrl: './sorting-page.css'
})
export class SortingPage {
  incomingTrain: Wagon[] = [];
  
  tracks: Track[] = [
    { id: 1, name: 'Колія 1 (Львів)', wagons: [] },
    { id: 2, name: 'Колія 2 (Київ)', wagons: [] },
    { id: 3, name: 'Колія 3 (Одеса)', wagons: [] }
  ];

  sortingInProgress = false;

  // --- ЗМІННІ ДЛЯ ВІКНА НАЛАШТУВАНЬ ---
  isSettingsOpen = false;
  tempTracks: Track[] = []; // Тимчасовий масив, поки ми не натиснули "Зберегти"

  constructor(private cdr: ChangeDetectorRef) {}

  addWagon() {
    const newNumber = '#' + Math.floor(Math.random() * 9000 + 1000);
    this.incomingTrain.push({ number: newNumber });
  }

  startSorting() {
    if (this.incomingTrain.length === 0) return;
    this.sortingInProgress = true;

    const interval = setInterval(() => {
      if (this.incomingTrain.length > 0) {
        const currentWagon = this.incomingTrain[0]; 
        this.incomingTrain = this.incomingTrain.slice(1);
        
        const randomTrackIndex = Math.floor(Math.random() * this.tracks.length);
        this.tracks[randomTrackIndex].wagons = [...this.tracks[randomTrackIndex].wagons, currentWagon];
        
        this.cdr.detectChanges();
      } else {
        clearInterval(interval);
        this.sortingInProgress = false;
        this.cdr.detectChanges(); 
      }
    }, 400); 
  }

  loadFromFile() {
    alert('Ця функція працюватиме з Java бекендом!');
  }

  // --- ЛОГІКА МОДАЛЬНОГО ВІКНА ---
  
  openSettings() {
    // Робимо копію існуючих колій, щоб випадково не зіпсувати їх, якщо натиснемо "Скасувати"
    this.tempTracks = JSON.parse(JSON.stringify(this.tracks));
    this.isSettingsOpen = true;
  }

  closeSettings() {
    this.isSettingsOpen = false;
  }

  addNewTrack() {
    // Шукаємо максимальний ID, щоб дати новому маршруту наступний номер
    const newId = this.tempTracks.length > 0 ? Math.max(...this.tempTracks.map(t => t.id)) + 1 : 1;
    this.tempTracks.push({ id: newId, name: 'Новий напрямок', wagons: [] });
  }

  removeTrack(index: number) {
    this.tempTracks.splice(index, 1);
  }

  saveSettings() {
    // Перезаписуємо реальні колії нашими налаштованими
    this.tracks = JSON.parse(JSON.stringify(this.tempTracks));
    this.isSettingsOpen = false;
  }
}