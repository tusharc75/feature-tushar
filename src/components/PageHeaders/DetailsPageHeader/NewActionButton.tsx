import { IconButton, IconButtonProps } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import ButtonMenu, { ButtonMenuProps } from 'src/components/ButtonMenu';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';

export type NewActionButtonProps<D> = {
  itemsVisibleCount?: number;
} & Omit<ButtonMenuProps<D>, 'showChevron'>;

const NewActionButton = <D,>({ items, itemsVisibleCount = 2, disabled, ...rest }: NewActionButtonProps<D>) => {
  const visibleItems = [...items].slice(0, itemsVisibleCount);
  const hiddenItems = [...items].slice(itemsVisibleCount);
  console.log("NewActionButtonProps",items)

  return (
    <>
      {visibleItems.map((item) => {
        const { label, ...rest } = item;
        return (
          <ThemeButton buttonType="themeBorder" key={item.label} iconForMobile={false} {...(rest as any)}>
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
                <IconButton
                  {...(props as IconButtonProps)}
                  sx={{ width: 32, height: 32, borderRadius: '4px', ...props?.sx }}
                  size="small"
                  className="new-dropdown-v1"
                >
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

export default NewActionButton;
