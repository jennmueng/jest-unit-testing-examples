import Advanced from './advanced';

// Complex class with multiple testing challenges
export class HardToTest {
  private static instance: HardToTest | null = null;
  private currentUser: string | null = null;
  private sessionStartTime: number;
  private _listeners: Function[] = [];
  private dataProcessor: Advanced;
  
  // Singleton pattern makes testing harder
  private constructor() {
    this.sessionStartTime = Date.now();
    // Direct DOM manipulation
    document.body.addEventListener('click', this.handleGlobalClick.bind(this));
    // External dependency with no injection mechanism
    this.dataProcessor = new Advanced(window.fetch.bind(window));
  }
  
  public static getInstance(): HardToTest {
    if (!HardToTest.instance) {
      HardToTest.instance = new HardToTest();
    }
    return HardToTest.instance;
  }
  
  // Method with side effects and non-deterministic behavior
  public async processUserData(userId: string): Promise<boolean> {
    this.currentUser = userId;
    
    // Non-deterministic behavior
    if (Math.random() > 0.5) {
      console.log('Random path A chosen');
      try {
        await this.dataProcessor.getData();
        const result = this.calculateUserScore();
        this.notifyListeners('score-updated', result);
        // Direct localStorage usage makes testing harder
        localStorage.setItem('lastUserScore', result.toString());
        return true;
      } catch (error) {
        console.error('Failed to process user data', error);
        return false;
      }
    } else {
      console.log('Random path B chosen');
      // Different execution path with setTimeout
      return new Promise((resolve) => {
        setTimeout(() => {
          this.notifyListeners('processing-delayed', userId);
          resolve(false);
        }, Math.random() * 1000 + 500); // Random delay
      });
    }
  }
  
  // Method that depends on the current time
  public getSessionDuration(): string {
    const duration = Date.now() - this.sessionStartTime;
    return `Session duration: ${this.formatDuration(duration)}`;
  }
  
  // Helper that formats time differently based on duration
  private formatDuration(ms: number): string {
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)} seconds`;
    } else if (seconds < 3600) {
      return `${(seconds / 60).toFixed(1)} minutes`;
    } else {
      return `${(seconds / 3600).toFixed(1)} hours`;
    }
  }
  
  // Method that reads global window properties
  public getBrowserInfo(): object {
    return {
      userAgent: navigator.userAgent,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      dpr: window.devicePixelRatio,
      online: navigator.onLine,
    };
  }
  
  // Complex calculation with many branches
  private calculateUserScore(): number {
    const baseScore = 100;
    const hourOfDay = new Date().getHours();
    let timeMultiplier = 1;
    
    // Time-dependent logic
    if (hourOfDay < 6) timeMultiplier = 1.5;
    else if (hourOfDay < 12) timeMultiplier = 1.2;
    else if (hourOfDay < 18) timeMultiplier = 1.0;
    else timeMultiplier = 1.3;
    
    // Get data from external source that varies
    const dataPoints = Object.keys(this.dataProcessor.data).length;
    const dataMultiplier = Math.max(1, Math.log(dataPoints + 1));
    
    // Complex, multi-factor calculation
    return Math.round(baseScore * timeMultiplier * dataMultiplier * (Math.random() * 0.2 + 0.9));
  }
  
  // Event handler for DOM events
  private handleGlobalClick(event: MouseEvent): void {
    console.log(`Click detected at ${event.clientX},${event.clientY}`);
    if ((event.target as HTMLElement).tagName === 'BUTTON') {
      this.notifyListeners('button-clicked', event.target);
    }
  }
  
  // Observer pattern implementation
  public addListener(callback: Function): void {
    this._listeners.push(callback);
  }
  
  public removeListener(callback: Function): void {
    this._listeners = this._listeners.filter(cb => cb !== callback);
  }
  
  private notifyListeners(eventType: string, data: any): void {
    this._listeners.forEach(callback => {
      try {
        callback(eventType, data);
      } catch (e) {
        console.error('Listener error', e);
      }
    });
  }
  
  // Method that uses eval (very hard to test safely)
  public executeUserConfig(configString: string): any {
    try {
      // Using eval is dangerous and makes testing very difficult
      return eval(`(function() { return ${configString}; })()`);
    } catch (error) {
      console.error('Invalid configuration', error);
      return null;
    }
  }
  
  // For testing purposes only - should not be used in production
  public static resetInstance(): void {
    HardToTest.instance = null;
  }
}

// Global usage of the singleton makes imports have side effects
export const globalProcessor = HardToTest.getInstance();

// Export a function that directly uses navigator APIs
export function detectMobileDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

// A function with nested callbacks and complex async patterns
export async function fetchUserDataWithRetry(userId: string, maxRetries = 3): Promise<any> {
  let retryCount = 0;
  
  async function attemptFetch(): Promise<any> {
    try {
      const response = await fetch(`https://api.example.com/users/${userId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retry attempt ${retryCount} for user ${userId}`);
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 500 + Math.random() * 500;
        return new Promise(resolve => {
          setTimeout(() => resolve(attemptFetch()), delay);
        });
      }
      throw error;
    }
  }
  
  return attemptFetch();
} 