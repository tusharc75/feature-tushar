import React from 'react';
import DatePickerCell from 'src/components/EditableExcelTable/TableComponents/Cells/DatePickerCell';
import DateTimePickerCell from 'src/components/EditableExcelTable/TableComponents/Cells/DateTimePickerCell';
import DropDownCell from 'src/components/EditableExcelTable/TableComponents/Cells/DropDownCell';
import Input from 'src/components/EditableExcelTable/TableComponents/Cells/Input';
import { CellProps } from 'src/components/EditableExcelTable/types';

const EditableCells = (props: CellProps) => {
  const { column } = props;
  const type = column.type;

  switch (type) {
    case 'dropDown': {
      return <DropDownCell {...props} />;
    }
    case 'multiSelect': {
      return <DropDownCell {...props} />;
    }
    case 'date': {
      return <DatePickerCell {...props} />;
    }
    case 'dateTime': {
      return <DateTimePickerCell {...props} />;
    }
    case 'decimal': {
      return <Input {...props} type={'number'} />;
    }
    default: {
      return <Input {...props} />;
    }
  }
};

export default EditableCells;
