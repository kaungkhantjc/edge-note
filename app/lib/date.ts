const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
});

/**
 * Formats a date string, number, or object into a standard format used across the app.
 * Example: "Feb 12, 2026 11:32 AM"
 */
export const formatDate = (date: Date | string | number | null | undefined) => {
    if (!date) return "N/A";
    try {
        const dateObj = typeof date === 'string' || typeof date === 'number'
            ? new Date(date)
            : date;

        // Ensure it's a valid date
        if (isNaN(dateObj.getTime())) return "N/A";

        return DATE_FORMATTER.format(dateObj).replace(',', '');
    } catch (e) {
        return "N/A";
    }
};
