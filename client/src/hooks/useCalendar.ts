import { useState } from "react";
import { addMonths, subMonths } from "date-fns";

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigateMonth = (direction: number) => {
    setCurrentDate(prevDate => 
      direction > 0 ? addMonths(prevDate, 1) : subMonths(prevDate, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToDate = (date: Date) => {
    setCurrentDate(date);
  };

  return {
    currentDate,
    navigateMonth,
    goToToday,
    goToDate,
  };
}
