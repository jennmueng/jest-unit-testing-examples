/**
 * A more testable implementation that still has some complexity
 * This file demonstrates code that has some testing challenges
 * but follows better practices than hardToTest.ts
 */

// Domain types
export interface User {
  id: string;
  name: string;
  email: string;
  lastLogin?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
}

export interface ApiClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: any): Promise<T>;
}

export interface Logger {
  log(message: string, data?: any): void;
  error(message: string, error?: any): void;
}

export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// Implementation of a user service with moderate complexity
export class UserService {
  private cachedUsers: Map<string, User> = new Map();
  private lastFetchTime: number = 0;
  private fetchInProgress: boolean = false;
  
  constructor(
    private apiClient: ApiClient,
    private logger: Logger,
    private storage: Storage,
    private cacheDuration: number = 60000 // 1 minute cache by default
  ) {}
  
  /**
   * Fetches a user by ID, with caching
   * Has conditional logic and async behavior
   */
  async getUserById(id: string): Promise<User> {
    // Check cache first
    const cachedUser = this.cachedUsers.get(id);
    const now = Date.now();
    
    if (cachedUser && (now - this.lastFetchTime < this.cacheDuration)) {
      this.logger.log('Cache hit for user', { id });
      return cachedUser;
    }
    
    // Prevent duplicate in-flight requests
    if (this.fetchInProgress) {
      return new Promise((resolve) => {
        // Wait for current fetch to complete then try again
        setTimeout(() => {
          resolve(this.getUserById(id));
        }, 100);
      });
    }
    
    try {
      this.fetchInProgress = true;
      this.logger.log('Fetching user data', { id });
      
      const user = await this.apiClient.get<User>(`/users/${id}`);
      
      // Store in cache
      this.cachedUsers.set(id, user);
      this.lastFetchTime = now;
      
      // Also save to persistent storage
      this.saveUserToStorage(user);
      
      return user;
    } catch (error) {
      this.logger.error('Failed to fetch user', error);
      
      // Try to load from storage as fallback
      const storedUser = this.getUserFromStorage(id);
      if (storedUser) {
        return storedUser;
      }
      
      throw new Error(`Failed to fetch user with ID ${id}`);
    } finally {
      this.fetchInProgress = false;
    }
  }
  
  /**
   * Updates user preferences
   * Has side effects but they're controllable through dependency injection
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserPreferences>
  ): Promise<User> {
    let user: User;
    
    try {
      // Get current user data
      user = await this.getUserById(userId);
      
      // Merge with new preferences
      const updatedPreferences: UserPreferences = {
        theme: 'system',
        notifications: false,
        language: 'en',
        ...user.preferences,
        ...preferences
      };
      
      // Update on server
      user = await this.apiClient.post<User>(
        `/users/${userId}/preferences`,
        updatedPreferences
      );
      
      // Update cache
      user.preferences = updatedPreferences;
      this.cachedUsers.set(userId, user);
      
      // Update storage
      this.saveUserToStorage(user);
      
      this.logger.log('Updated user preferences', { userId, preferences });
      return user;
    } catch (error) {
      this.logger.error('Failed to update preferences', error);
      throw new Error(`Failed to update preferences for user ${userId}`);
    }
  }
  
  /**
   * Calculates a user score based on various factors
   * Pure function but with complex logic
   */
  calculateUserScore(user: User): number {
    if (!user) return 0;
    
    let score = 10; // Base score
    
    // Factor 1: Email domain
    if (user.email) {
      const domain = user.email.split('@')[1];
      if (domain === 'gmail.com') score += 5;
      else if (domain === 'hotmail.com') score += 3;
      else if (domain.endsWith('.edu')) score += 10;
      else if (domain.endsWith('.gov')) score += 15;
      else score += 2;
    }
    
    // Factor 2: Last login recency
    if (user.lastLogin) {
      const daysSinceLogin = (Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLogin < 1) score += 20;
      else if (daysSinceLogin < 7) score += 15;
      else if (daysSinceLogin < 30) score += 5;
    }
    
    // Factor 3: Name length (just for complexity)
    if (user.name) {
      const nameParts = user.name.trim().split(' ');
      score += Math.min(nameParts.length * 2, 10);
      
      // Bonus for long names
      const totalLength = user.name.length;
      if (totalLength > 15) score += 3;
      else if (totalLength > 10) score += 2;
      else if (totalLength > 5) score += 1;
    }
    
    // Factor 4: Preferences set
    if (user.preferences) {
      if (user.preferences.notifications) score += 5;
      if (user.preferences.theme === 'dark') score += 2;
      if (user.preferences.language && user.preferences.language !== 'en') score += 3;
    }
    
    return Math.round(score);
  }
  
  /**
   * Private helper method to save user to storage
   */
  private saveUserToStorage(user: User): void {
    try {
      this.storage.setItem(`user_${user.id}`, JSON.stringify(user));
    } catch (error) {
      this.logger.error('Failed to save user to storage', error);
    }
  }
  
  /**
   * Private helper method to get user from storage
   */
  private getUserFromStorage(id: string): User | null {
    try {
      const data = this.storage.getItem(`user_${id}`);
      if (!data) return null;
      
      const user = JSON.parse(data) as User;
      
      // Convert string date back to Date object
      if (user.lastLogin) {
        user.lastLogin = new Date(user.lastLogin);
      }
      
      return user;
    } catch (error) {
      this.logger.error('Failed to get user from storage', error);
      return null;
    }
  }
  
  /**
   * Clears the cache
   */
  clearCache(): void {
    this.cachedUsers.clear();
    this.lastFetchTime = 0;
  }
}

// Default implementations that could be used in production
// but would be mocked in tests

export class DefaultApiClient implements ApiClient {
  constructor(private baseUrl: string = 'https://api.example.com') {}
  
  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
  }
  
  async post<T>(url: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
  }
}

export class ConsoleLogger implements Logger {
  log(message: string, data?: any): void {
    console.log(`[LOG] ${message}`, data || '');
  }
  
  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error || '');
  }
}

export class LocalStorage implements Storage {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }
  
  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
  
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}

// Helper to create an instance with default implementations
export function createDefaultUserService(baseUrl?: string): UserService {
  return new UserService(
    new DefaultApiClient(baseUrl),
    new ConsoleLogger(),
    new LocalStorage()
  );
} 