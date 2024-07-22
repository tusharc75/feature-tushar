import { Popper } from '@material-ui/core';
import { useState } from 'react';
import { IoCaretDown } from 'react-icons/io5';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import Carousel from 'react-material-ui-carousel';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';

function GroupSignatureCell({ field, original }) {
  const [anchorEl, setAnchorEl] = useState<HTMLSpanElement | HTMLDivElement | null>(null);

  const handleMouseOver = (event: React.MouseEvent<HTMLSpanElement | HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (e: React.MouseEvent<HTMLSpanElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const signatures = original[field.fieldName]?.filter((ele) => ele.user && ele.signature) ?? [];

  return (
    <div>
      {signatures?.length ? (
        <>
          <span onMouseOver={handleMouseOver} className="link">
            View
          </span>
          <Popper open={open} anchorEl={anchorEl} placement="top">
            <div
              className="min-w-[200px] rounded-md bg-[var(--dark-primary,white)] p-[10px] drop-shadow-lg [border:1px_solid_var(--common-border-color)] [filter:drop-shadow(0_4px_3px_rgb(0_0_0_/_0.07))_drop-shadow(0_2px_2px_rgb(0_0_0_/_0.06))]"
              style={{ transform: 'translateY(-11px)' }}
              onMouseLeave={handleClose}
            >
              <div className="relative translate-y-2 items-center text-center">
                <div className="max-h-[100px] min-w-[100px] space-y-1 overflow-x-hidden overflow-y-hidden">
                  <Carousel
                    strictIndexing
                    animation="slide"
                    autoPlay={false}
                    // navButtonsAlwaysInvisible
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
                        <Link
                          to={`${routes?.userDetail?.path}/${signatureUser?.user?._id}`}
                          target="_blank"
                          className="link"
                          rel="noopener noreferrer"
                        >
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
                <div className="filler absolute -bottom-[43px] -left-[10px] -right-[10px] h-[48px]"></div>
                <IoCaretDown
                  size={24}
                  className="absolute -bottom-[26px] left-0 right-0 z-10 mx-auto !stroke-[var(--common-border-color)] text-[var(--dark-primary,white)] "
                />
              </div>
            </div>
          </Popper>
        </>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
}

export default GroupSignatureCell;
