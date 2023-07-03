import React, { ReactNode, useState, useCallback, FC, ChangeEvent } from 'react';
import styles from './index.module.scss';
import CardWithCheckBox from './CardWithCheckbox';
import type { GridProps } from '@material-ui/core/Grid';
import { createBodyColumns, ColumnInterface } from './helper';
import { Checkbox, FormControlLabel, FormGroup } from '@material-ui/core';

interface TableInterface extends React.HTMLAttributes<HTMLDivElement> {
  data: any[];
  accessor: CardInterface;
  uniqueKey: (data: any) => string;
  checkBox?: boolean;
  onSelect?: any;
  height?: string;
  dense?: boolean;
  showSelectAll?: boolean;
  collapsible?: boolean;
}
export interface CardInterface extends React.HTMLAttributes<HTMLDivElement> {
  name: (data: any) => string | ReactNode;
  checked?: boolean;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>, data: any) => void;
  onCardClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, data: any) => void;
  bodyColumns: BodyColumns[];
  headerColumns: ColumnsInterface[];
  collapsible?: boolean;
}

interface BodyColumns extends ColumnsInterface, GridProps {}
export interface ColumnsInterface extends React.HTMLAttributes<HTMLDivElement> {
  minWidth?: number;
  width?: number;
  render: (data: any) => ReactNode | string;
  component?: (data: any) => 'completedChip' | 'pendingChip' | 'div';
}

const CustomTableWithCard: FC<TableInterface> = ({
  data,
  accessor,
  uniqueKey,
  className,
  checkBox,
  onSelect = null,
  height,
  dense = false,
  showSelectAll = false,
  collapsible = false,
  ...others
}) => {
  const [selected, setSelected] = useState<any>([]);
  const { name, bodyColumns, headerColumns, checked, onInputChange = null, onCardClick = null, ...cardProps } = accessor;

  const selectAll = useCallback(() => {
    if (selected.length === data?.filter((e) => !e?.hideSelection).length) {
      setSelected([]);
      onSelect([]);
    } else {
      setSelected(data?.filter((e) => !e?.hideSelection));
      onSelect(data?.filter((e) => !e?.hideSelection));
    }
  }, [selected.length, data.length]);

  const isChecked = useCallback(
    (row) => {
      return selected.findIndex((item) => uniqueKey(item) === uniqueKey(row)) > -1 ? true : false;
    },
    [selected]
  );

  const chekSingle = useCallback(
    (row) => {
      const checked = isChecked(row);
      if (checked) {
        const newSelected = selected.filter((item) => uniqueKey(item) !== uniqueKey(row));
        setSelected(newSelected);
        onSelect(newSelected);
      } else {
        const newSelected = [...selected, row];
        setSelected(newSelected);
        onSelect(newSelected);
      }
    },
    [selected, isChecked]
  );

  return (
    <>
      {showSelectAll && (
        <FormGroup row className={styles.selectall}>
          <FormControlLabel
            control={<Checkbox checked={selected.length === data?.filter((e) => !e?.hideSelection).length} onChange={selectAll} name="select-all" />}
            label="Select All"
          />
        </FormGroup>
      )}
      <div {...others} className={styles.wrapper} style={{ maxHeight: height, ...others.style }}>
        {data.map((row) => (
          <CardWithCheckBox
            key={uniqueKey(row)}
            checked={checked ?? isChecked(row)}
            onInputChange={(e, data) => {
              if (onInputChange) onInputChange(e, data);
              chekSingle(data);
            }}
            checkBox={checkBox}
            onCardClick={(e, data) => {
              if (onCardClick) onCardClick(e, data);
              if (checkBox) chekSingle(data);
            }}
            row={row}
            name={name}
            bodyColumns={bodyColumns}
            headerColumns={headerColumns}
            collapsible={collapsible}
            {...cardProps}
          />
        ))}
      </div>
    </>
  );
};

export { createBodyColumns };
export type { ColumnInterface };
export default CustomTableWithCard;
