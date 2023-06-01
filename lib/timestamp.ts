export const oneDayTimestamp = 60 * 60 * 24;
export const twoWeeksTimestamp = oneDayTimestamp * 14;

export function getTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}