import { Breadcrumbs } from '@mui/material';
import { Link } from 'react-router-dom';
import { HomeIconBreadcrumb } from 'src/assets/newSvgs';

const linkClassName = 'cursor-pointer text-[--new-theme-color] font-semibold text-[12px] leading-[14.5px] text-truncate';
const lastLinkClassName = 'text-[#777575] dark:text-[white] font-semibold text-[12px] leading-[14.5px] text-truncate';

const CustomBreadCrumbs = ({ routes = [], isConfirmBeforeClick = false, onBreadCrumbClick = null, onRouteClick = null }) => {
  return (
    <Breadcrumbs
      separator={<span className="flex w-[24px] justify-center text-[#474747] dark:text-[white]">/</span>}
      aria-label="breadcrumb"
      className="site-breadcrumb"
    >
      {isConfirmBeforeClick ? (
        <span className={`${linkClassName} flex items-center gap-[6px]`} onClick={() => onBreadCrumbClick('/')}>
          <HomeIconBreadcrumb /> Home
        </span>
      ) : (
        <Link to="/" className={`${linkClassName}  flex items-center gap-[6px]`}>
          <HomeIconBreadcrumb /> Home
        </Link>
      )}

      {routes.map((route, index) => {
        return index !== routes.length - 1 ? (
          isConfirmBeforeClick ? (
            <span key={index} className={linkClassName} onClick={() => onBreadCrumbClick(route.path)}>
              {route.title}
            </span>
          ) : (
            <Link key={index} to={route.path} className={linkClassName}>
              {route.title}
            </Link>
          )
        ) : (
          <span
            onClick={() => {
              if (route?.hasOnClick) {
                onRouteClick();
              }
            }}
            key={index}
            className={lastLinkClassName}
          >
            {route.title}
          </span>
        );
      })}
    </Breadcrumbs>
  );
};

export default CustomBreadCrumbs;
