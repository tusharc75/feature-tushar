import { ExpandMore } from '@mui/icons-material';
import { Collapse, IconButton } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from 'src/constants/helpers';

type CustomCollapsibleProps = {
  head: React.ReactNode;
  onChange?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, data: boolean) => void;
  expanded?: boolean;
  defaultExpanded?: boolean;
  element?: keyof HTMLElementTagNameMap;
  children: React.ReactNode | Element[];
  className?: string;
  headProps?: Partial<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  /**
   * Defines the trigger area for collapsing and expanding the collapsible component.
   * If `entireHead` is specified, clicking anywhere on the header will toggle the collapsible.
   * If `onlyToggleButton` is specified, only the designated button will toggle the collapse/expand functionality.
   * @default "entireHead"
   */
  toggleTriggerArea?: 'entireHead' | 'onlyToggleButton';
  toggleIconPosition?: 'start' | 'end' | 'hidden';
};

const CustomCollapsible = ({
  defaultExpanded = false,
  expanded,
  onChange,
  element = 'div',
  children,
  className,
  toggleTriggerArea = 'entireHead',
  headProps: { className: headClassname, ...restHeadProps } = {},
  head,
  toggleIconPosition = 'end'
}: CustomCollapsibleProps) => {
  const [stateExpanded, setStateExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (typeof expanded === 'boolean') {
      setStateExpanded(expanded);
    }
  }, [expanded]);

  const toggleExpand = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setStateExpanded((prev) => {
      const newData = !prev;
      if (onChange && typeof onChange === 'function') {
        onChange(e, newData);
      }
      return newData;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleButton = useMemo(
    () => (
      <IconButton
        size={'small'}
        color={'primary'}
        onClick={(e) => {
          if (toggleTriggerArea === 'onlyToggleButton') {
            toggleExpand(e);
          }
        }}
      >
        <ExpandMore className={cn('origin-center transition-transform', stateExpanded ? '[transform:rotate(180deg)]' : '')} fontSize="small" />
      </IconButton>
    ),
    [stateExpanded, toggleExpand, toggleTriggerArea]
  );

  return React.createElement(
    element, // Dynamically sets the HTML element based on the `element` prop
    { className: cn('custom-collapsible-container border-b', className) },
    <>
      <button
        {...restHeadProps}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between bg-transparent px-4 py-[10px] text-left outline-none transition-colors  focus-visible:shadow-[inset_0px_0px_0px_1px_var(--new-theme-color)] dark:text-white',
          stateExpanded ? 'bg-[--accordion-expanded-summary-bg,#f1f5ff]' : '',
          headClassname
        )}
        onClick={(e) => {
          if (toggleTriggerArea === 'entireHead') {
            toggleExpand(e);
          }
        }}
      >
        {toggleIconPosition === 'start' && toggleButton}
        <div className="flex-grow">{head}</div>
        {toggleIconPosition === 'end' && toggleButton}
      </button>
      <Collapse in={stateExpanded} timeout="auto" unmountOnExit>
        {children}
      </Collapse>
    </>
  );
};

export default CustomCollapsible;
