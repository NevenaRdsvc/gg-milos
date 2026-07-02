import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  NgFor,
  NgIf
} from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'la-game-page',
  standalone: true,
  imports: [
    NgFor,
    NgIf
  ],
  templateUrl: './game-page.component.html',
  styleUrl: './game-page.component.scss'
})
export class GamePageComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('mapWrapper') mapWrapper!: ElementRef<HTMLDivElement>;

  zoom = 1;
  mapExpanded = false;

  score = 6000;

  roundDuration = 300;
  remainingSeconds = this.roundDuration;

  private readonly outlineRectWidth = 166;
  private readonly outlineRectHeight = 48;
  readonly outlinePerimeter =
    2 * (this.outlineRectWidth - this.outlineRectHeight) + Math.PI * this.outlineRectHeight;

  showResultModal = false;
  showMerchModal = false;
  showTimeUpModal = false;
  isCorrectGuess = false;
  distanceKm = 0;
  timeExpired = false;

  readonly maxLazaToasts = 3;
  private readonly lazaSpawnIntervalMs = 1200;
  private readonly lazaExitDurationMs = 600;
  lazaToasts: { id: number; removing: boolean }[] = [];
  private lazaCounter = 0;

  private map?: L.Map;
  private marker?: L.Marker;
  private timerHandle?: ReturnType<typeof setInterval>;
  private lazaIntervalHandle?: ReturnType<typeof setInterval>;
  private readonly startCenter: L.LatLngTuple = [15, 20];
  private readonly startZoom = 2;
  private readonly targetLocation: L.LatLngTuple = [44.4667, 20.6167];
  private readonly correctThresholdKm = 500;
  private readonly exactThresholdKm = 50;

  ngOnInit(): void {
    this.timerHandle = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;

        if (this.remainingSeconds === 0) {
          this.timeExpired = true;
          this.showTimeUpModal = true;
          clearInterval(this.timerHandle);
        }
      }
    }, 1000);

    this.spawnLazaToast();
    this.lazaIntervalHandle = setInterval(() => this.spawnLazaToast(), this.lazaSpawnIntervalMs);
  }

  ngAfterViewInit(): void {
    // Defensive: a leftover map instance from a previous HMR swap on the same
    // DOM node causes exactly the kind of partial/overlapping tile rendering
    // seen in production HMR — make sure we never attach two instances.
    this.map?.remove();

    this.map = L.map(this.mapContainer.nativeElement, {
      center: this.startCenter,
      zoom: this.startZoom,
      zoomControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: false
    });

    L.control.zoom({
      position: 'bottomleft'
    }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => this.onMapClick(event));

    // The container's real size isn't always settled the instant the map is created,
    // which leaves Leaflet's tile grid calculated for the wrong bounds (visible gaps).
    requestAnimationFrame(() => this.map?.invalidateSize());
  }

  ngOnDestroy(): void {
    this.map?.remove();
    clearInterval(this.timerHandle);
    clearInterval(this.lazaIntervalHandle);
  }

  private spawnLazaToast() {
    this.lazaToasts = [...this.lazaToasts, { id: this.lazaCounter++, removing: false }];

    const active = this.lazaToasts.filter(toast => !toast.removing);
    if (active.length > this.maxLazaToasts) {
      const oldest = active[0];
      oldest.removing = true;
      setTimeout(() => {
        this.lazaToasts = this.lazaToasts.filter(toast => toast.id !== oldest.id);
      }, this.lazaExitDurationMs);
    }
  }

  trackByLazaId(_: number, toast: { id: number }): number {
    return toast.id;
  }

  zoomIn() {
    if (this.zoom < 3) {
      this.zoom += 0.2;
    }
  }

  zoomOut() {
    if (this.zoom > 1) {
      this.zoom -= 0.2;
    }
  }

  get hasMarker(): boolean {
    return !!this.marker;
  }

  get timerLabel(): string {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  get outlineOffset(): number {
    const progress = this.remainingSeconds / this.roundDuration;
    return this.outlinePerimeter * (1 - progress);
  }

  get resultSubtitle(): string {
    if (!this.isCorrectGuess) {
      return `You are ${this.distanceKm} km from the destination`;
    }
    if (this.distanceKm <= this.exactThresholdKm) {
      return 'Bravo Milos, we go to Kosmaj + Milica';
    }
    return `Bravo Milos, you were ${this.distanceKm} km away - but we are actually going to Kabinet Kosmaj, and we bring Milica too!`;
  }

  submitGuess() {
    if (!this.marker || this.timeExpired) return;

    const guess = this.marker.getLatLng();
    this.distanceKm = Math.round(
      this.haversineDistanceKm(guess.lat, guess.lng, this.targetLocation[0], this.targetLocation[1])
    );
    this.isCorrectGuess = this.distanceKm <= this.correctThresholdKm;
    this.showResultModal = true;
  }

  closeResultModal() {
    this.showResultModal = false;
  }

  onResultContinue() {
    this.showResultModal = false;
    if (this.isCorrectGuess) {
      this.showMerchModal = true;
    }
  }

  closeMerchModal() {
    this.showMerchModal = false;
  }

  closeTimeUpModal() {
    this.showTimeUpModal = false;
  }

  collapseMap() {
    if (!this.mapExpanded) return;
    this.mapExpanded = false;
    this.invalidateSizeAfterResize();
  }

  private onMapClick(event: L.LeafletMouseEvent) {
    if (!this.map || this.timeExpired) return;

    if (!this.mapExpanded) {
      this.mapExpanded = true;
      this.invalidateSizeAfterResize();
      return;
    }

    this.marker?.remove();

    this.marker = L.marker(event.latlng, {
      icon: L.divIcon({
        className: 'guess-pin',
        html: '📍',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      })
    }).addTo(this.map);
  }

  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadiusKm = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private invalidateSizeAfterResize() {
    const wrapperEl = this.mapWrapper.nativeElement;
    const onTransitionEnd = () => {
      this.map?.invalidateSize();
      wrapperEl.removeEventListener('transitionend', onTransitionEnd);
    };
    wrapperEl.addEventListener('transitionend', onTransitionEnd);
  }
}
