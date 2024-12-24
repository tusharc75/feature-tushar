import { IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@material-ui/icons';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from 'src/constants/helpers';

export type CalendarProps = { showBorder?: boolean } & React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, showBorder = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('rdp-calendar-main relative w-fit rounded-md p-3 ', showBorder && '[border:1px_solid_var(--common-border-color)]', className)}
      classNames={{
        months: 'flex flex-col md:flex-row gap-4',
        month: 'space-y-4 relative',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        month_caption: 'flex justify-center pt-1 relative items-center',
        button_next: 'absolute right-1 cursor-pointer top-0',
        button_previous: 'absolute left-1 cursor-pointer top-0',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn('data-[outside=true]:opacity-50 '),
        day_button: cn(
          `inline-flex items-center justify-center gap-2 shadow-none cursor-pointer bg-transparent border-0
          whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
          focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
          [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-gray-200 dark:hover:bg-gray-800
          hover:text-accent-foreground h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-[--primary-text]`
        ),
        day_range_end: 'day-range-end',
        day_today: 'bg-accent text-accent-foreground',
        day_outside: 'day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        weeks: 'space-y-2',
        week: 'flex w-full mt-2',
        weekdays: 'flex w-full',
        weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        month_grid: 'w-full border-collapse space-y-1',
        ...classNames
      }}
      components={{
        Nav: ({ onNextClick, onPreviousClick, nextMonth, previousMonth, ...rest }) => {
          return (
            <nav {...rest} className="absolute left-3 right-3 top-3">
              <span className="absolute left-0 top-0 z-10 ">
                <IconButton size="small" onClick={onPreviousClick} data-previousMonth={previousMonth}>
                  <ChevronLeft className={cn('h-4 w-4', className)} />
                </IconButton>
              </span>
              <span className="absolute right-0 top-0 z-10">
                <IconButton size="small" onClick={onNextClick} data-nextMonth={nextMonth}>
                  <ChevronRight className={cn('h-4 w-4', className)} />
                </IconButton>
              </span>
            </nav>
          );
        }
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
