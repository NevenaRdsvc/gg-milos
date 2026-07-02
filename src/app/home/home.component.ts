import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  NgIf
} from '@angular/common';
import {
  Router
} from '@angular/router';
import confetti from 'canvas-confetti';

@Component({
  selector: 'la-home',
  imports: [
    NgIf
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {

  showIntroModal = false;

  private confettiInterval: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.startConfetti();
  }

  ngOnDestroy(): void {
    if (this.confettiInterval) {
      clearInterval(this.confettiInterval);
    }
  }

  startConfetti(): void {
    const defaults = {
      startVelocity: 25,
      spread: 560,
      ticks: 60,
      zIndex: 9999,
      gravity: 0.8,
      scalar: 0.9,
      colors: [
        '#FF4B4B',
        '#FF7B00',
        '#A855F7',
        '#EC4899',
        '#FFFFFF'
      ]
    };

    this.confettiInterval = setInterval(() => {
      confetti({
        ...defaults,
        particleCount: 120,
        origin: {
          x: 0.05,
          y: 0.35
        }
      });

      confetti({
        ...defaults,
        particleCount: 120,
        origin: {
          x: 0.95,
          y: 0.35
        }
      });
    }, 700);
  }

  openIntroModal(): void {
    this.showIntroModal = true;
  }

  closeIntroModal(): void {
    this.showIntroModal = false;
  }

  goToGame(): void {
    this.router.navigate(['/game']);
  }
}
