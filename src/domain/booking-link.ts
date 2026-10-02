const isoDate=/^\d{4}-\d{2}-\d{2}$/;

function toUtcDate(value:string){
  if(!isoDate.test(value))throw new Error("INVALID_BOOKING_LINK_WINDOW");
  const date=new Date(`${value}T12:00:00Z`);
  if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==value)throw new Error("INVALID_BOOKING_LINK_WINDOW");
  return date;
}

export function validateBookingLinkWindow(startDate:string,endDate:string){
  const start=toUtcDate(startDate);
  const end=toUtcDate(endDate);
  if(end<start)throw new Error("INVALID_BOOKING_LINK_WINDOW");
  const days=Math.round((end.getTime()-start.getTime())/86_400_000)+1;
  if(days>31)throw new Error("BOOKING_LINK_WINDOW_TOO_LARGE");
  return {startDate,endDate};
}

export function isDateWithinBookingLink(date:string,startDate:string,endDate:string){
  if(!isoDate.test(date)||!isoDate.test(startDate)||!isoDate.test(endDate))return false;
  return date>=startDate&&date<=endDate;
}
