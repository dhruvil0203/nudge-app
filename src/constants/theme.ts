export const lightTheme = {
  primary: '#007AFF',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E5E5EA',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  cardBackground: '#FFFFFF',
  tabBackground: '#FFFFFF',
  tabInactive: '#999999',
};

export const darkTheme = {
  primary: '#0A84FF',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#424245',
  error: '#FF453A',
  success: '#32D74B',
  warning: '#FF9500',
  cardBackground: '#1C1C1E',
  tabBackground: '#1C1C1E',
  tabInactive: '#666666',
};

export type Theme = typeof lightTheme;
