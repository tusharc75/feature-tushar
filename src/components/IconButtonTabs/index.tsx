import { IconButton, IconButtonProps } from '@material-ui/core';
import React from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn } from 'src/constants/helpers';

type IconButtonTabProps<D> = {
  items: Item<D>[];
  value: D;
  setValue: (value: D) => void;
  onItemClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, item: Item<D>) => void;
};

type Item<D> = {
  icon: React.ReactNode;
  value: D;
  tooltip?: string;
} & IconButtonProps;

const IconButtonTabs = <D,>({ items, setValue, value, onItemClick = () => {} }: IconButtonTabProps<D>) => {
  return (
    <div className="flex items-center divide-x rounded-[4px] border">
      {items.map((item) => {
        const { onClick: itemClick = () => {}, disabled, ...rest } = item;
        return (
          <HtmlTooltip key={JSON.stringify(item.value)} title={item.tooltip || ''}>
            <IconButton
              style={{ display: 'block', padding: '7px', borderRadius: 0 }}
              size="small"
              onClick={(e) => {
                setValue(item.value);
                itemClick?.(e);
                onItemClick?.(e, item);
              }}
              disabled={disabled || value === item.value}
              {...rest}
            >
              <span
                className={cn(
                  'block h-4 w-4 text-[16px] [&>svg]:h-4 [&>svg]:w-4',
                  value === item.value ? 'text-[--new-theme-color]' : 'text-[#CCCCCC]'
                )}
              >
                {item.icon}
              </span>
            </IconButton>
          </HtmlTooltip>
        );
      })}
    </div>
  );
};

export default IconButtonTabs;
