import React, { FC } from 'react';
import styles from './index.module.scss';

import type { CardInterface } from './';
import { Checkbox, Typography } from '@material-ui/core';

interface CardWithCheckboxProps extends CardInterface {
  row: any;
  checkBox: boolean;
}

const CardWithCheckbox: FC<CardWithCheckboxProps> = ({
  row,
  name,
  checked,
  onInputChange,
  onCardClick,
  checkBox,
  bodyColumns,
  headerColumns,
  ...props
}) => {
  return (
    <div
      {...props}
      onClick={(e) => {
        if (props.onClick) {
          props.onClick(e);
        }
        onCardClick(e, row);
      }}
      className={`${styles.singleCard} ${(checkBox && !row?.hideSelection) || props.onClick ? styles.cardWithCheckbox : ''} ${props.className || ''}`}
    >
      {checkBox && (
        <div className={styles.checkbox}>
          {row?.hideSelection ? null : (
            <Checkbox style={{ padding: '0' }} inputProps={{ 'aria-label': 'Select' }} checked={checked} onChange={(e) => onInputChange(e, row)} />
          )}
        </div>
      )}
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <Typography component={'h6'}>{name(row)}</Typography>
          <div className={styles.headerColumns}>
            {headerColumns.map((headerCol, index) => {
              const { style, minWidth, width, render, component, ...rest } = headerCol;
              const copmp = component?.(row) || 'div';
              if (copmp === 'div') {
                return (
                  <div key={index} {...rest} style={{ ...style, minWidth: minWidth, width: width }}>
                    {render(row)}
                  </div>
                );
              }

              if (copmp.endsWith('Chip')) {
                return (
                  <div key={index} {...rest} style={{ ...style, minWidth: minWidth, width: width }} className={`${styles.chip} ${styles[copmp]}`}>
                    {render(row)}
                  </div>
                );
              }

              return (
                <div key={index} {...rest} style={{ ...style, minWidth: minWidth, width: width }}>
                  {render(row)}
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.cardBody}>
          {bodyColumns.map((bodyCol, index) => {
            const { style, minWidth, width, render, ...rest } = bodyCol;
            return (
              <div
                key={index}
                {...rest}
                className={`${styles.bodyColumn} ${rest.className || ''}`}
                style={{ ...style, minWidth: minWidth, width: width }}
              >
                {render(row)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CardWithCheckbox;
