import React, { FC, useEffect } from 'react';
import styles from './index.module.scss';

import type { CardInterface } from './';
import { Checkbox, IconButton, Grid } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

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
  collapsible = false,
  ...props
}) => {
  const [collapsed, setCollapsed] = React.useState(collapsible);
  const containerRef = useCollapse({ collapsed, minHeight: 'auto', childClassName: styles.bodyColumn });

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
          {name(row)}
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
        <div ref={containerRef} className={`${styles.collapsible} `}>
          <Grid container spacing={3} className={styles.cardBody}>
            {bodyColumns.map((bodyCol, index) => {
              const { style, minWidth, width, render, ...rest } = bodyCol;
              return (
                <Grid
                  item
                  key={index}
                  {...rest}
                  className={`${styles.bodyColumn} ${rest.className || ''}`}
                  style={{ ...style, minWidth: minWidth !== undefined ? minWidth : 'auto', width: width !== undefined ? width : 'auto' }}
                >
                  {render(row)}
                </Grid>
              );
            })}
          </Grid>
          {collapsible && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed((prev) => !prev);
              }}
            >
              {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardWithCheckbox;
interface CollapseProps {
  minHeight?: number | 'auto';
  collapsed?: boolean;
  childClassName: string;
}

type CollpasebleElement = HTMLDivElement;
const useCollapse = ({ minHeight = 'auto', collapsed = true, childClassName }: CollapseProps) => {
  const containerRef = React.useRef<CollpasebleElement>(null);
  const [firstElementHeight, setFirstElementHeight] = React.useState<number>(61);

  function collapseSection(element: CollpasebleElement) {
    const sectionHeight = element.scrollHeight;
    const elementTransition = element.style.transition;
    element.style.transition = '';
    element.style.overflow = 'hidden';

    requestAnimationFrame(function () {
      element.style.height = sectionHeight + 'px';
      element.style.transition = elementTransition;
      requestAnimationFrame(function () {
        element.style.height = minHeight === 'auto' ? firstElementHeight + 'px' : minHeight + 'px';
      });
    });
    element.setAttribute('data-collapsed', 'true');
  }

  function expandSection(element: CollpasebleElement) {
    const sectionHeight = element.scrollHeight;

    const transitionComplete = () => {
      element.style.height = null;
      element.style.overflow = null;
      element.removeEventListener('transitionend', transitionComplete);
    };
    element.style.height = sectionHeight + 'px';
    element.addEventListener('transitionend', transitionComplete, false);
    element.setAttribute('data-collapsed', 'false');

    // useEffect cleanup
    return () => element.removeEventListener('transitionend', transitionComplete);
  }

  const getFirstElementHeight = (element: CollpasebleElement) => {
    if (!childClassName || childClassName === '') return;
    const heightOffset = 20;
    const firstElement = element.querySelector('.' + childClassName + ':first-child');
    if (firstElement) {
      setFirstElementHeight(firstElement.clientHeight - heightOffset);
    }
  };

  React.useLayoutEffect(() => {
    if (containerRef.current) getFirstElementHeight(containerRef.current);
    if (collapsed && containerRef.current) {
      collapseSection(containerRef.current);
    }
    if (!collapsed && containerRef.current) {
      expandSection(containerRef.current);
    }
  }, [collapsed]);

  return containerRef;
};
