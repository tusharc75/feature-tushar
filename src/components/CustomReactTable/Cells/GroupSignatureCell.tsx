import { Popper } from '@material-ui/core';
import { useState } from 'react';
import { IoCaretDown } from 'react-icons/io5';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import Carousel from 'react-material-ui-carousel';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { isArray } from 'lodash';
import CellTooltip from 'src/components/CustomReactTable/Cells/CellTooltip';

function GroupSignatureCell({ field, original }) {
  const signatures = isArray(original?.[field.fieldName]) ? original?.[field.fieldName]?.filter((ele) => ele.user && ele.signature) : [];

  return (
    <div>
      {signatures?.length ? (
        <CellTooltip>
          <div className="max-h-[100px] min-w-[100px] space-y-1 overflow-x-hidden overflow-y-hidden">
            <Carousel
              strictIndexing
              animation="slide"
              autoPlay={false}
              cycleNavigation={signatures.length > 1 ? true : false}
              indicators={false}
              timeout={150}
              navButtonsProps={{
                style: {
                  opacity: 0.4,
                  padding: 2,
                  borderRadius: '50%'
                }
              }}
            >
              {signatures?.map((signatureUser: any, i) => (
                <div className="flex flex-col items-center gap-1">
                  <Link to={`${routes?.userDetail?.path}/${signatureUser?.user?._id}`} target="_blank" className="link" rel="noopener noreferrer">
                    {signatureUser?.user?.concatedName}
                  </Link>
                  <img
                    className="h-20 w-20 object-contain dark:[filter:invert(1)]"
                    alt={signatureUser?.user?.concatedName}
                    src={signatureUser?.signature}
                  />
                </div>
              ))}
            </Carousel>
          </div>
        </CellTooltip>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
}

export default GroupSignatureCell;
