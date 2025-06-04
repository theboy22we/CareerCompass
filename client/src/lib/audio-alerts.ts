export class AudioAlerts {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;

  constructor() {
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  private createTone(frequency: number, duration: number, volume: number = 0.3): void {
    if (!this.audioContext || !this.isEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playBuySignal(): void {
    // Ascending tone for buy signals
    this.createTone(800, 0.2);
    setTimeout(() => this.createTone(1000, 0.2), 100);
  }

  playSellSignal(): void {
    // Descending tone for sell signals
    this.createTone(1000, 0.2);
    setTimeout(() => this.createTone(800, 0.2), 100);
  }

  playTradeExecuted(): void {
    // Quick success chime
    this.createTone(600, 0.1);
    setTimeout(() => this.createTone(800, 0.1), 50);
    setTimeout(() => this.createTone(1000, 0.15), 100);
  }

  playPositionClosed(isWinning: boolean): void {
    if (isWinning) {
      // Positive chime for winning trades
      this.createTone(800, 0.15);
      setTimeout(() => this.createTone(1200, 0.2), 75);
    } else {
      // Lower tone for losing trades
      this.createTone(400, 0.3);
    }
  }

  playScaleUp(): void {
    // Rising scale for position scaling
    const frequencies = [500, 600, 700, 800, 900];
    frequencies.forEach((freq, index) => {
      setTimeout(() => this.createTone(freq, 0.1, 0.2), index * 50);
    });
  }

  playEmergencyStop(): void {
    // Urgent alert tone
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.createTone(1500, 0.2, 0.5);
        setTimeout(() => this.createTone(1200, 0.2, 0.5), 100);
      }, i * 300);
    }
  }

  playNotification(): void {
    // Simple notification beep
    this.createTone(800, 0.15, 0.2);
  }
}

export const audioAlerts = new AudioAlerts();
