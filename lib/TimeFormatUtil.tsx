export const formatTime = (timeInSeconds: number): string => {
    const days = Math.floor(timeInSeconds / 86400)
    const hours = Math.floor((timeInSeconds % 86400) / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    return `${days}:${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
};

const padZero = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
};

export const parseCustomDuration = (customDuration: string): number => {
    const [days, time] = customDuration.split(" ");
    const [hours, minutes, seconds] = time.split(":");

    return (
        (parseInt(days || "0") * 24 * 60 * 60 +
        parseInt(hours || "0") * 60 * 60 +
        parseInt(minutes || "0") * 60 +
        parseInt(seconds || "0")) * 1000
    );
};

export const daysToMillis = (days: number) => {
    return days * 24 * 60 * 60 * 1000
}