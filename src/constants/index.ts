export const REMINDER_OPTIONS = {
  NO_REMINDER: 'no_reminder',
  IN_1_MINUTE: 'in_1_minute',
  IN_1_HOUR: 'in_1_hour',
  TONIGHT: 'tonight',
  TOMORROW: 'tomorrow',
  CUSTOM: 'custom',
};

export const PRIORITY_LEVELS = {
  SOMEDAY: 'someday',
  NORMAL: 'normal',
  IMPORTANT: 'important',
};

export const PRIORITY_COLORS = {
  important: '#14B8A6',
  normal: '#7C3AED',
  someday: '#8E8E93',
};

export const PRIORITY_ICONS = {
  someday: '◦',
  normal: '.',
  important: '!',
};

export const REMINDER_LABELS = {
  no_reminder: 'No Reminder',
  in_1_minute: 'In 1 Minute',
  in_1_hour: 'In 1 Hour',
  tonight: 'Tonight at 8 PM',
  tomorrow: 'Tomorrow at 9 AM',
  custom: 'Custom',
};

export const REMINDER_ICONS: Record<string, string> = {
  no_reminder: '—',
  in_1_minute: '1m',
  in_1_hour: '1h',
  tonight: 'PM',
  tomorrow: 'AM',
  custom: '...',
};

export const EMPTY_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image';
