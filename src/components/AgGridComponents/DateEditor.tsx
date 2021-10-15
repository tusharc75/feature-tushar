import { useState, forwardRef, useImperativeHandle } from 'react';
import DateFnsUtils from '@date-io/date-fns';
import { format } from 'date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import { dateFormatForInputControl } from '../../constants/helpers';

export default forwardRef((props: any, ref) => {
  const [selectedDate, setSelectedDate] = useState(null);

  function handleDateChange(d) {
    if (d) {
      d.setHours(0, 0, 0, 0);
    }
    setSelectedDate(d);
  }

  useImperativeHandle(ref, () => {
    return {
      getValue: () => {
        let dateString = null;
        if (selectedDate) {
          dateString = format(selectedDate, dateFormatForInputControl);
        }
        return dateString;
      },
      isCancelAfterEnd: () => {
        return !selectedDate;
      },
      afterGuiAttached: () => {
        if (!props.value) {
          return;
        }
        // const [_, day, month, year] = props.value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        // let selectedDate = new Date(year, month - 1, day);
        let selectedDate = new Date(props.value);
        setSelectedDate(selectedDate);
      }
    };
  });

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDatePicker
        style={{ width: '100%', margin: 0, padding: '6px 10px' }}
        margin="normal"
        id="date-picker-dialog"
        format={dateFormatForInputControl}
        value={selectedDate}
        onChange={handleDateChange}
        variant="inline"
        disableToolbar
        placeholder={'Enter ' + props.column.colId}
      />
    </MuiPickersUtilsProvider>
  );
});
