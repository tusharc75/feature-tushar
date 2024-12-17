import { IconButton, IconButtonProps } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import ButtonMenu, { ButtonMenuProps } from 'src/components/ButtonMenu';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';

export type NewActionButtonProps<D extends string> = {
  itemsVisibleCount?: number;
} & Omit<ButtonMenuProps<D>, 'showChevron'>;

const NewActionButton = <D extends string>({ items, itemsVisibleCount = 2, disabled, ...rest }: NewActionButtonProps<D>) => {
  const visibleItems = [...items].slice(0, itemsVisibleCount);
  const hiddenItems = [...items].slice(itemsVisibleCount);

  return (
    <>
      {visibleItems.map((item) => {
        const { label, ...rest } = item;
        return (
          <ThemeButton key={item.label} iconForMobile={false} {...(rest as any)}>
            {label}
          </ThemeButton>
        );
      })}
      {hiddenItems.length > 0 && (
        <ButtonMenu
          {...rest}
          disabled={disabled}
          slot={
            ((props) => (
              <HtmlTooltip title="More Actions">
                <IconButton {...(props as IconButtonProps)} size="small" style={{ width: 32, height: 32 }} className="new-dropdown-v1">
                  <MoreVert />
                </IconButton>
              </HtmlTooltip>
            )) as any
          }
          items={hiddenItems}
        />
      )}
    </>
  );
};

// const SlotButton = (props: IconButtonProps) => (

// );

export default NewActionButton;
