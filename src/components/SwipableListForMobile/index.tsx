import React, { FC } from 'react';
import { Checkbox, FormControlLabel } from '@material-ui/core';

import moment from 'moment';
import { Fragment, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { dateFormat } from '../../constants/helpers';
import type { TSwipableListInputProps } from './types';

const SwipableListForMobile: FC<TSwipableListInputProps> = ({
  dispatch,
  allowSelection,
  renderPrimaryField,
  dataRows,
  rowCount,
  renderedFrom,
  page,
  loading,
  renderSecondaryField,
  renderIcons,
  chips
}) => {
  const [isAllChecked, setIsAllChecked] = useState(false);

  return (
    <>
      {allowSelection && (
        <div className="all-check-box">
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={isAllChecked && dataRows?.every((d) => d?.isChecked === true || d?.hideSelection === true)}
                onChange={(e) => {
                  setIsAllChecked(e.target.checked);
                  const updatedMetadata = dataRows.map((d) => {
                    return { ...d, isChecked: !d.hideSelection ? e.target.checked : false };
                  });
                  dispatch({
                    type: 'selection',
                    selectedRecords: updatedMetadata.filter((d) => d.isChecked)
                  });
                  dispatch({ type: 'update', data: updatedMetadata });
                  localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(updatedMetadata.filter((d) => d.isChecked)));
                }}
                name="checkedB"
                color="primary"
              />
            }
            label="Check All"
          />
        </div>
      )}
      <div className="relative">
        {loading ? (
          <div className=" absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.54)] dark:bg-[rgba(5,9,19,0.54)] backdrop-blur-[10px]">
            <div className="bg-[white] dark:bg-[var(--dark-secondary)] px-10 py-5 rounded-lg">
              <div className="spinner"></div>
              <p className="-ml-[3px] mt-2">Loading</p>
            </div>
          </div>
        ) : null}
        <div style={{ overflowY: 'auto', height: 'calc(100vh - 215px)' }} id={`scrollableDiv_${renderedFrom}`} className="">
          <div>
            <InfiniteScroll
              dataLength={dataRows.length}
              next={() => {
                setTimeout(() => {
                  dispatch({ type: 'pageChange', page: page + 1 });
                }, 500);
              }}
              hasMore={dataRows.length !== rowCount}
              loader={<h3 className="text-center border mt-3 p-3 loading-dots">Loading more items</h3>}
              scrollableTarget={`scrollableDiv_${renderedFrom}`}
              endMessage={
                !loading && dataRows.length === rowCount ? (
                  <h3 className="text-center border px-3 py-2 mx-2">{'Total no. of records found ' + dataRows.length}</h3>
                ) : (
                  <></>
                )
              }
            >
              {dataRows.map((d, index) => (
                <div
                  className="shadow-[0px_3px_26px_0px_rgba(0,0,0,0.06)] rounded-md my-2 px-3 py-2 [--left-gutter:20px] dark:bg-[var(--dark-secondary)]"
                  key={d._id}
                  style={{ border: '1px solid var(--common-border-color)' }}
                >
                  <div className={`flex gap-2 items-center`}>
                    {allowSelection && !d.hideSelection && (
                      <div>
                        <Checkbox
                          size="small"
                          className="p-0"
                          color="primary"
                          checked={d.isChecked}
                          onChange={(e) => {
                            dataRows[index].isChecked = e.target.checked;
                            setIsAllChecked(dataRows.every((d) => d.isChecked === true || d?.hideSelection === true));
                            const record = dataRows.filter((d) => d.isChecked);
                            dispatch({
                              type: 'selection',
                              selectedRecords: record
                            });
                            dispatch({ type: 'update', data: [...dataRows] });
                            localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(record));
                          }}
                          inputProps={{ 'aria-label': 'primary checkbox' }}
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <div className="heading-with-icon">
                        {renderPrimaryField && <h4 className="quote-name text-truncate">{renderPrimaryField(d)}</h4>}
                        {renderIcons && <div className="icon-layout  d-flex align-items-center gap-2">{renderIcons(d)}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="swipe-card-additional-details pl-[var(--left-gutter)]">{renderSecondaryField && renderSecondaryField(d)}</div>
                  {chips?.length > 0 && (
                    <div className="mt-1 pt-2" style={{ borderTop: '1px solid var(--common-border-color)' }}>
                      <div className=" d-flex gap-1 flex-wrap">
                        {[
                          ...chips?.map((c) =>
                            c.forceShow === true || d[c.field] ? (
                              <div>
                                <span
                                  title={`${c.label} ${(c.fieldType === 'date' ? moment(d[c.field]).format(dateFormat) : d[c.field]) ?? ''}`}
                                  style={{ border: '1px solid #B8CCFE' }}
                                  className="rounded-full line-clamp-1 block px-3 py-[3px] font-semibold text-[12px] bg-[#F2F6FF] dark:bg-[var(--dark-primary)] dark:border-[var(--common-border-color)_!important]"
                                  key={c.field}
                                  onClick={c.onClick ? () => c.onClick(d) : null}
                                >
                                  {c.startIcon && <span className="mr-2">{c.startIcon}</span>}
                                  {`${c.label} ${(c.fieldType === 'date' ? moment(d[c.field]).format(dateFormat) : d[c.field]) ?? ''}`}
                                  {c.endIcon && <span className="ml-2">{c.endIcon}</span>}
                                </span>
                              </div>
                            ) : (
                              <Fragment key={c.field}></Fragment>
                            )
                          )
                        ]}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </>
  );
};

export type { TSwipableListInputProps };
export default SwipableListForMobile;
