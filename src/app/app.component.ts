import {
  CommonModule
} from '@angular/common';
import {
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';
import {
  RouterModule
} from '@angular/router';
import {
  TranslateService
} from '@ngx-translate/core';

import {
  environment
} from '../environments/environment';
import {
  LS_USER_LANGUAGE
} from './shared/constants';

@Component({
  selector: 'la-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  @ViewChild('musicFrame') musicFrame!: ElementRef<HTMLIFrameElement>;

  showLoadingSpinner = true;
  isDark = false;
  musicMuted = true;

  private readonly backgroundTrackId = 'pV2pC-mPUGU';
  readonly backgroundMusicUrl: SafeResourceUrl;

  constructor(
    private translateService: TranslateService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
  ) {
    const src =
      `https://www.youtube.com/embed/${this.backgroundTrackId}` +
      `?autoplay=0&mute=1&loop=1&playlist=${this.backgroundTrackId}` +
      `&controls=0&playsinline=1&enablejsapi=1`;
    this.backgroundMusicUrl = this.sanitizer.bypassSecurityTrustResourceUrl(src);

    let languageToUse = environment.defaultLanguage;
    this.translateService.setDefaultLang(languageToUse);
    const savedLanguage = localStorage.getItem(LS_USER_LANGUAGE);
    const savedDark = localStorage.getItem('darkMode');

    if (savedLanguage) {
      languageToUse = savedLanguage;
    } else {
      localStorage.setItem(LS_USER_LANGUAGE, languageToUse);
    }

    this.translateService.use(languageToUse);
    this.isDark = savedDark === 'true';
  }

  ngOnInit(): void {
    this.zone.onStable.subscribe(() => (this.showLoadingSpinner = false));
  }

  toggleDarkMode() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-mode', this.isDark);
    localStorage.setItem('darkMode', this.isDark ? 'true' : 'false');
  }

  toggleMusic() {
    this.musicMuted = !this.musicMuted;

    if (this.musicMuted) {
      this.postPlayerCommand('mute');
      this.postPlayerCommand('pauseVideo');
    } else {
      this.postPlayerCommand('unMute');
      this.postPlayerCommand('playVideo');
    }
  }

  private postPlayerCommand(func: string) {
    this.musicFrame?.nativeElement.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      '*'
    );
  }
}
