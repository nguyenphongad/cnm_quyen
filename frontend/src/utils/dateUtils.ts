/**
 * Format date to locale string
 * @param dateString ISO date string
 * @param options Date format options
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  const dateOptions = options || defaultOptions;
  
  return new Date(dateString).toLocaleDateString('vi-VN', dateOptions);
};

/**
 * Format date for input fields (YYYY-MM-DDThh:mm)
 * @param dateString ISO date string
 * @returns Date string formatted for datetime-local inputs
 */
export const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
};

/**
 * Check if a date is in the past
 * @param dateString ISO date string
 * @returns True if date is in the past
 */
export const isDatePast = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

/**
 * Get relative time (e.g. "2 days ago", "in 3 hours")
 * @param dateString ISO date string
 * @returns Relative time string
 */
export const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 0) {
    // Future date
    const absDiff = Math.abs(diffInSeconds);
    if (absDiff < 60) return `trong ${absDiff} giây`;
    if (absDiff < 3600) return `trong ${Math.floor(absDiff / 60)} phút`;
    if (absDiff < 86400) return `trong ${Math.floor(absDiff / 3600)} giờ`;
    if (absDiff < 2592000) return `trong ${Math.floor(absDiff / 86400)} ngày`;
    if (absDiff < 31536000) return `trong ${Math.floor(absDiff / 2592000)} tháng`;
    return `trong ${Math.floor(absDiff / 31536000)} năm`;
  } else {
    // Past date
    if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
    return `${Math.floor(diffInSeconds / 31536000)} năm trước`;
  }
}; 