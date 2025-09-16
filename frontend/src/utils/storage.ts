import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../constants/app';
import { logError, AppError } from './errorHandling';

/**
 * Storage utility class for managing AsyncStorage operations
 */
class StorageManager {
  /**
   * Store a value in AsyncStorage
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      logError(new AppError(`Failed to store item with key: ${key}`), { key, value });
      return false;
    }
  }

  /**
   * Retrieve a value from AsyncStorage
   */
  async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return defaultValue || null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logError(new AppError(`Failed to retrieve item with key: ${key}`), { key });
      return defaultValue || null;
    }
  }

  /**
   * Remove a value from AsyncStorage
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      logError(new AppError(`Failed to remove item with key: ${key}`), { key });
      return false;
    }
  }

  /**
   * Clear all AsyncStorage data
   */
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      logError(new AppError('Failed to clear AsyncStorage'));
      return false;
    }
  }

  /**
   * Get all keys from AsyncStorage
   */
  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      logError(new AppError('Failed to get all keys from AsyncStorage'));
      return [];
    }
  }

  /**
   * Check if a key exists in AsyncStorage
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      logError(new AppError(`Failed to check if key exists: ${key}`), { key });
      return false;
    }
  }

  /**
   * Store multiple items at once
   */
  async setMultiple(items: Array<[string, any]>): Promise<boolean> {
    try {
      const serializedItems: [string, string][] = items.map(([key, value]) => [key, JSON.stringify(value)]);
      await AsyncStorage.multiSet(serializedItems);
      return true;
    } catch (error) {
      logError(new AppError('Failed to store multiple items'), { items });
      return false;
    }
  }

  /**
   * Get multiple items at once
   */
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const values = await AsyncStorage.multiGet(keys);
      const result: Record<string, T | null> = {};

      values.forEach(([key, value]) => {
        try {
          result[key] = value ? JSON.parse(value) as T : null;
        } catch {
          result[key] = null;
        }
      });

      return result;
    } catch (error) {
      logError(new AppError('Failed to get multiple items'), { keys });
      return {};
    }
  }

  // Specific methods for common app data

  /**
   * Store authentication token
   */
  async setAuthToken(token: string): Promise<boolean> {
    return this.setItem(APP_CONFIG.storage.authToken, token);
  }

  /**
   * Get authentication token
   */
  async getAuthToken(): Promise<string | null> {
    return this.getItem<string>(APP_CONFIG.storage.authToken);
  }

  /**
   * Remove authentication token
   */
  async removeAuthToken(): Promise<boolean> {
    return this.removeItem(APP_CONFIG.storage.authToken);
  }

  /**
   * Store refresh token
   */
  async setRefreshToken(token: string): Promise<boolean> {
    return this.setItem(APP_CONFIG.storage.refreshToken, token);
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return this.getItem<string>(APP_CONFIG.storage.refreshToken);
  }

  /**
   * Remove refresh token
   */
  async removeRefreshToken(): Promise<boolean> {
    return this.removeItem(APP_CONFIG.storage.refreshToken);
  }

  /**
   * Store user preferences
   */
  async setUserPreferences(preferences: Record<string, any>): Promise<boolean> {
    return this.setItem(APP_CONFIG.storage.userPreferences, preferences);
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<Record<string, any> | null> {
    return this.getItem<Record<string, any>>(APP_CONFIG.storage.userPreferences, {});
  }

  /**
   * Store theme mode
   */
  async setThemeMode(mode: 'light' | 'dark'): Promise<boolean> {
    return this.setItem(APP_CONFIG.storage.themeMode, mode);
  }

  /**
   * Get theme mode
   */
  async getThemeMode(): Promise<'light' | 'dark' | null> {
    return this.getItem<'light' | 'dark'>(APP_CONFIG.storage.themeMode);
  }

  /**
   * Store font family
   */
  async setFontFamily(fontFamily: string): Promise<boolean> {
    return this.setItem(APP_CONFIG.storage.fontFamily, fontFamily);
  }

  /**
   * Get font family
   */
  async getFontFamily(): Promise<string | null> {
    return this.getItem<string>(APP_CONFIG.storage.fontFamily);
  }

  /**
   * Clear all authentication data
   */
  async clearAuthData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        APP_CONFIG.storage.authToken,
        APP_CONFIG.storage.refreshToken,
      ]);
      return true;
    } catch (error) {
      logError(new AppError('Failed to clear authentication data'));
      return false;
    }
  }

  /**
   * Clear all user data (for logout)
   */
  async clearUserData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        APP_CONFIG.storage.authToken,
        APP_CONFIG.storage.refreshToken,
        APP_CONFIG.storage.userPreferences,
      ]);
      return true;
    } catch (error) {
      logError(new AppError('Failed to clear user data'));
      return false;
    }
  }

  /**
   * Get storage size (for debugging)
   */
  async getStorageSize(): Promise<number> {
    try {
      const keys = await this.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return totalSize;
    } catch (error) {
      logError(new AppError('Failed to calculate storage size'));
      return 0;
    }
  }
}

// Export singleton instance
export const storage = new StorageManager();

// Export the class for testing purposes
export { StorageManager };