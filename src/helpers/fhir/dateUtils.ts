 interface Period {
    start: string;
    end: string;
  }
  
  interface HistoryData {
    arrived: Period;
    inProgress: Period;
    finished: Period;
  }
  
  export function parseDate(dateStr: string): Date {
    return new Date(dateStr);
  }
  
  export function formatDate(dateObj: Date): string {
    return dateObj.toISOString();
  }
  
  export function validatePeriod(period: Period, nextPeriod: Period | null = null): Period {
    let startDate = parseDate(period.start);
    let endDate = parseDate(period.end);

    if (startDate > endDate) {
      period.start = formatDate(endDate);
      startDate = endDate;
    }

    if (nextPeriod) {
      let nextStartDate = parseDate(nextPeriod.start);
      let nextEndDate = parseDate(nextPeriod.end);
  
      if (endDate > nextStartDate) {
        period.end = formatDate(nextStartDate);
        endDate = nextStartDate;
      }
  
      if (startDate > nextStartDate) {
        period.start = formatDate(nextStartDate);
      }
    }
  
    return period;
  }
  
  export function validateAndFixDates(data: HistoryData): HistoryData {
    data.arrived = validatePeriod(data.arrived, data.inProgress);
    data.inProgress = validatePeriod(data.inProgress, data.finished);
    data.finished = validatePeriod(data.finished);
  
    let arrivedStart = parseDate(data.arrived.start);
    let arrivedEnd = parseDate(data.arrived.end);
    let inProgressStart = parseDate(data.inProgress.start);
  
    if (arrivedStart >= arrivedEnd) {
        data.arrived.start = formatDate(new Date(arrivedEnd.getTime() - 1000)); 
    }
  
      
    if (arrivedEnd >= inProgressStart) {
      data.inProgress.start = formatDate(new Date(arrivedEnd.getTime() + 1000)); 
      data.inProgress.end = formatDate(new Date(parseDate(data.inProgress.start).getTime() + 1000)); 
    }
  
    let inProgressEnd = parseDate(data.inProgress.end);
    let finishedStart = parseDate(data.finished.start);
  
    if (inProgressEnd >= finishedStart) {
      data.finished.start = formatDate(new Date(inProgressEnd.getTime() + 1000)); 
      data.finished.end = formatDate(new Date(parseDate(data.finished.start).getTime() + 1000));
    }
  
    return data;
  }
  export function validateHistoryData(data: HistoryData): boolean {
    const { arrived, inProgress, finished } = data;

    const arrivedStart = parseDate(arrived.start);
    const arrivedEnd = parseDate(arrived.end);
    const inProgressStart = parseDate(inProgress.start);
    const inProgressEnd = parseDate(inProgress.end);
    const finishedStart = parseDate(finished.start);
    const finishedEnd = parseDate(finished.end);

    // Check for empty start or end values
    const hasEmptyValues = 
    !arrived.start || !arrived.end ||
    !inProgress.start || !inProgress.end ||
    !finished.start || !finished.end;

    const hasInvalidDateRange =
        arrivedStart > arrivedEnd ||
        inProgressStart > inProgressEnd ||
        finishedStart > finishedEnd;

    const isSequentialOrderInvalid =
        arrivedEnd > inProgressStart ||
        inProgressEnd > finishedStart;

    return hasInvalidDateRange || isSequentialOrderInvalid || hasEmptyValues;
}

  