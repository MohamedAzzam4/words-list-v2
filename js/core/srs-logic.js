export function getLocalDateString(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const INTERVALS = [0, 1, 3, 7, 15, 31, 999];

export function calculateNextReview(currentLevel, isDue, isCorrect, currentIsoStr) {
    let newLevel = currentLevel;
    
    if (isCorrect) {
        if (isDue || currentLevel === 0) {
            newLevel = Math.min(currentLevel + 1, 6);
        }
    } else {
        if (currentLevel === 0) {
            newLevel = 0;
        } else {
            newLevel = Math.max(currentLevel - 2, 1);
        }
    }
    
    const intervalDays = INTERVALS[newLevel];
    const baseDate = new Date(currentIsoStr);
    
    // Calculate exact milliseconds (intervalDays * 24 hours)
    const exactNextTime = baseDate.getTime() + (intervalDays * 24 * 60 * 60 * 1000);
    const nextReviewDate = new Date(exactNextTime).toISOString();
    
    return {
        level: newLevel,
        nextReviewDate
    };
}
