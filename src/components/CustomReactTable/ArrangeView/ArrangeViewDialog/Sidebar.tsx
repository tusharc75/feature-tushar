import { Checkbox, FormControlLabel, IconButton } from '@mui/material';
import { TbLayoutSidebarFilled } from 'react-icons/tb';
import { SidebarProps } from './types';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn } from 'src/constants/helpers';
import { memo, useCallback, useMemo } from 'react';
import { CheckBoxOutlined } from '@mui/icons-material';

const Sidebar = memo(({ state, values, setFieldValue }: SidebarProps) => {
  const { isSidebarOpen, loading, toggleSidebar, filterdColumns, handleSearch, search, columnsWithoutSticky, isMobile } = state;
  const isAllVisible = useMemo(() => values.hide.length === 0, [values.hide.length]);
  const indeterminate = useMemo(
    () => !isAllVisible && values.hide.length < columnsWithoutSticky.length,
    [columnsWithoutSticky.length, isAllVisible, values.hide.length]
  );

  const visibleColumnMap = useMemo<{ [key: string]: boolean }>(() => {
    const visibleColumns: { [key: string]: boolean } = {};
    for (const col of columnsWithoutSticky) {
      const key = col.id ?? col.accessor;
      if (!values.hide.includes(key)) {
        visibleColumns[key] = true;
      } else {
        visibleColumns[key] = false;
      }
    }
    return visibleColumns;
  }, [columnsWithoutSticky, values.hide]);

  const handleCheckAll = useCallback(() => {
    if (isAllVisible) {
      setFieldValue(
        'hide',
        columnsWithoutSticky.filter((d) => d.disabled !== true).map((c) => c?.id ?? c?.accessor)
      );
    } else {
      setFieldValue('hide', []);
    }
  }, [isAllVisible, setFieldValue, columnsWithoutSticky]);

  const handleCheckSingle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, colName: string) => {
      const checked = e.target.checked;

      let hiddenColumns = [...values.hide];
      if (checked) {
        hiddenColumns = hiddenColumns.filter((c) => c !== colName);
      } else {
        hiddenColumns.push(colName);
      }
      setFieldValue('hide', hiddenColumns);
    },
    [setFieldValue, values.hide]
  );

  return (
    <aside
      className={cn(
        'transition-[width] duration-300 ',
        isMobile ? 'absolute bottom-0 left-0 top-0 z-[11] bg-[--dark-primary,white]' : '[border-right:1px_solid_var(--common-border-color)]',
        isMobile && isSidebarOpen ? 'w-[--sidebar-width] [border-right:1px_solid_var(--common-border-color)]' : isMobile ? 'w-0' : ''
      )}
    >
      <div
        className={cn(
          'w-[--sidebar-width] px-[17px] py-[15px] transition-transform duration-300',
          isMobile ? `shadow-md` : '[border-right:1px_solid_var(--common-border-color)]',
          isMobile && isSidebarOpen ? '[transform:translateX(0)]' : isMobile ? '[transform:translateX(calc(var(--sidebar-width)*-1))]' : ''
        )}
      >
        <div className="mb-[15px] flex items-center gap-2">
          <Checkbox
            indeterminateIcon={<CheckBoxOutlined />}
            inputProps={{ 'aria-label': 'select all' }}
            checked={isAllVisible}
            indeterminate={indeterminate}
            onChange={handleCheckAll}
            size="small"
          />
          <SearchBox onChange={handleSearch} value={search} disabled={loading} />
          {isMobile && <ToggleSidebar toggleSidebar={() => toggleSidebar()} />}
        </div>
        <ul className={cn('overflow-y-auto overflow-x-hidden', isMobile ? 'h-[--content-max-h]' : 'max-h-[--content-max-h]')}>
          {filterdColumns?.map((column) => {
            const key = column.id ?? column.accessor;
            const checked = visibleColumnMap[key];
            return (
              <li
                key={key}
                className={cn('flex cursor-pointer list-none items-center gap-[5px] rounded-lg text-[12px] font-medium leading-[14.5px]')}
              >
                <FormControlLabel
                  sx={{ ml: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      disabled={column.disabled}
                      inputProps={{ 'aria-label': `Select #{key}` }}
                      checked={checked}
                      onChange={(e) => handleCheckSingle(e, key)}
                    />
                  }
                  label={column.Header}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
});

export default Sidebar;

export const ToggleSidebar = ({ toggleSidebar }) => (
  <IconButton size="small" style={{ padding: 5, height: 32, width: 32 }} onClick={toggleSidebar}>
    <TbLayoutSidebarFilled className="text-[--new-theme-color]" />
  </IconButton>
);
