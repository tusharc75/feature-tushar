import { Delete, MoreVert } from '@mui/icons-material';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, MenuList } from '@mui/material';
import React, { useState } from 'react';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import { createEmptyRowData } from 'src/components/EditableExcelTable/utils';
import RippleButton from 'src/components/RippleButton';
import { addItemAtIndex, cn, removeItemAtIndex, addItemAtExactIndex } from 'src/constants/helpers';

const LINE_HEIGHT = 2;

const handleMouseOver = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>, container: HTMLDivElement, lineElement: HTMLDivElement) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const top = rect.top - containerRect.top + container.scrollTop;
  const centerY = rect.height * 0.5 + top - LINE_HEIGHT * 0.5;
  lineElement.style.top = `${centerY}px`;
  lineElement.style.display = 'block';
};
const handleMouseOut = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>, container: HTMLDivElement, lineElement: HTMLDivElement) => {
  lineElement.style.display = 'none';
};

const IndexCell = React.memo(
  ({
    rowIndex,
    rowLineRef,
    containerRef
  }: {
    rowIndex: number;
    rowLineRef: React.MutableRefObject<HTMLDivElement>;
    containerRef: React.MutableRefObject<HTMLDivElement>;
  }) => {
    const [data, setStore] = useEditableTableStore((prev) => prev.tableData);
    const [columns] = useEditableTableStore((prev) => prev.columns);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement>(null);

    const handleClose = () => {
      setAnchorEl(null);
    };

    return (
      <>
        <td className="sticky left-0 z-[9] min-w-[45px] border-b border-r bg-[var(--dark-primary,white)] p-1 text-center text-gray-500 dark:text-gray-400">
          <span
            onMouseOver={(e) => handleMouseOver(e, containerRef.current, rowLineRef.current)}
            onMouseOut={(e) => handleMouseOut(e, containerRef.current, rowLineRef.current)}
            className="top group/inner absolute -top-[6px] left-0 hidden hover:-top-[9px] hover:z-[11] group-hover:block "
          >
            <RippleButton
              onClick={() => {
                setStore((prev) => ({
                  tableData: addItemAtIndex(prev.tableData, createEmptyRowData(columns), rowIndex),
                  dirtyRows: addItemAtExactIndex(prev.dirtyRows, undefined, rowIndex),
                  // pastekey is require to update
                  pasteKey: prev.pasteKey > 100 ? 0 : prev.pasteKey + 1
                }));
              }}
              className="block min-h-[10px] min-w-[10px] rounded-full border border-theme bg-[var(--dark-primary,white)] text-[12px] leading-[1]"
            >
              <span className="hidden h-[16px] w-[16px] items-center justify-center group-hover/inner:flex ">+</span>
            </RippleButton>
          </span>
          <div className="flex items-center">
            <span className={cn(' flex items-center justify-center group-hover:opacity-100', anchorEl ? '' : 'opacity-0')}>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ p: '2px' }}>
                <MoreVert fontSize="small" />
              </IconButton>
            </span>
            <span className="block flex-grow">{rowIndex + 1}</span>
          </div>
          {data.length - 1 === rowIndex && (
            <>
              <span
                onMouseOver={(e) => handleMouseOver(e, containerRef.current, rowLineRef.current)}
                onMouseOut={(e) => handleMouseOut(e, containerRef.current, rowLineRef.current)}
                className="bottom group/inner absolute -bottom-[6px] left-0 hidden hover:-bottom-[9px] group-hover:block"
              >
                <RippleButton
                  onClick={() => {
                    setStore((prev) => ({
                      tableData: addItemAtIndex(prev.tableData, createEmptyRowData(columns), rowIndex + 1),
                      dirtyRows: addItemAtExactIndex(prev.dirtyRows, undefined, rowIndex + 1),
                      // pastekey is require to update
                      pasteKey: prev.pasteKey > 100 ? 0 : prev.pasteKey + 1
                    }));
                  }}
                  className="block min-h-[10px] min-w-[10px] rounded-full border border-theme bg-[var(--dark-primary,white)] text-[12px] leading-[1]"
                >
                  <span className="hidden h-[16px] w-[16px] items-center justify-center group-hover/inner:flex ">+</span>
                </RippleButton>
              </span>
            </>
          )}

          <span className="absolute bottom-0 right-[-1px] top-0 z-10 h-full w-[1px] bg-[var(--common-border-color)]" />
        </td>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          slotProps={{
            list: {
              'aria-labelledby': 'basic-button',
              sx: { paddingBlock: 0 }
            }
          }}
        >
          <MenuList dense sx={{ minWidth: '200px' }}>
            <MenuItem
              onClick={() => {
                handleClose();
                setStore((prev) => ({ tableData: removeItemAtIndex(prev.tableData, rowIndex) }));
              }}
              color="error"
            >
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </MenuList>
        </Menu>
      </>
    );
  }
);

export default IndexCell;
