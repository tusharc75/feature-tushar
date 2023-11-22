import { FC } from 'react';

interface svgInterface extends React.SVGAttributes<SVGElement> {}
interface svgInterfaceWithSize extends svgInterface {
  size?: number;
}

export const Accepted: FC<svgInterfaceWithSize> = ({ size = 26, width = null, height = null, ...others }) => {
  return (
    <svg {...others} xmlns="http://www.w3.org/2000/svg" width={size ?? width} height={size ?? height} fill="none" viewBox="0 0 26 26">
      <g clipPath="url(#clip0_5508_25411)">
        <path
          fill="url(#paint0_linear_5508_25411)"
          d="M22.826 9.555a1.355 1.355 0 01-.531-1.279c.455-2.86-.065-3.737-.455-4.127-.39-.39-1.257-.9-4.117-.444a1.376 1.376 0 01-1.278-.531C14.56.661 13.575.368 13 .368c-.574 0-1.56.293-3.445 2.806a1.376 1.376 0 01-1.278.53c-2.86-.454-3.727.066-4.117.445-.39.38-.91 1.268-.455 4.127a1.354 1.354 0 01-.53 1.279C.66 11.44.378 12.425.378 13c0 .574.282 1.56 2.795 3.445a1.355 1.355 0 01.531 1.278c-.412 2.882.065 3.738.455 4.128.39.39 1.235.855 4.117.444a1.353 1.353 0 011.278.53c1.885 2.514 2.87 2.806 3.445 2.806.574 0 1.56-.292 3.445-2.805a1.353 1.353 0 011.278-.531c2.893.411 3.727-.065 4.117-.444.39-.38.867-1.246.455-4.128a1.354 1.354 0 01.53-1.278c2.514-1.885 2.796-2.871 2.796-3.445 0-.574-.282-1.56-2.795-3.445z"
        ></path>
        <path
          fill="#fff"
          d="M12.458 16.791a1.082 1.082 0 01-.769-.314l-2.167-2.166a1.088 1.088 0 011.539-1.539l1.397 1.409 3.565-3.575a1.084 1.084 0 011.538 0 1.084 1.084 0 010 1.538l-4.334 4.333a1.084 1.084 0 01-.769.314z"
        ></path>
      </g>
      <defs>
        <linearGradient id="paint0_linear_5508_25411" x1="4.126" x2="25.642" y1="0.368" y2="25.613" gradientUnits="userSpaceOnUse">
          <stop stopColor="#68C82E"></stop>
          <stop offset="1" stopColor="#03640D"></stop>
        </linearGradient>
        <clipPath id="clip0_5508_25411">
          <path fill="#fff" d="M0 0H26V26H0z"></path>
        </clipPath>
      </defs>
    </svg>
  );
};

export const Assigned: FC<svgInterfaceWithSize> = ({ size = 26, width = null, height = null, ...others }) => {
  return (
    <svg {...others} xmlns="http://www.w3.org/2000/svg" width={size ?? width} height={size ?? height} fill="none" viewBox="0 0 26 26">
      <path
        fill="url(#paint0_linear_5559_24282)"
        d="M17.97 4.629h-1.072a3.568 3.568 0 00-6.883 0H8.947A3.95 3.95 0 005 8.576V20.23a3.95 3.95 0 003.947 3.947h9.022a3.95 3.95 0 003.947-3.947V8.576a3.95 3.95 0 00-3.947-3.947zm-4.512-.94a.94.94 0 110 1.88.94.94 0 010-1.88zm4.237 9.473l-4.564 4.564a.94.94 0 01-1.327 0l-2.582-2.571a.94.94 0 111.33-1.327l1.914 1.913 3.898-3.91a.941.941 0 011.33 1.331z"
      ></path>
      <defs>
        <linearGradient id="paint0_linear_5559_24282" x1="7.511" x2="26.525" y1="2" y2="19.032" gradientUnits="userSpaceOnUse">
          <stop stopColor="#577BFC"></stop>
          <stop offset="1" stopColor="#1608BD"></stop>
        </linearGradient>
      </defs>
    </svg>
  );
};
export const Rejected: FC<svgInterfaceWithSize> = ({ size = 26, width = null, height = null, ...others }) => {
  return (
    <svg {...others} xmlns="http://www.w3.org/2000/svg" width={size ?? width} height={size ?? height} fill="none" viewBox="0 0 26 26">
      <path fill="#EE404C" d="M13 23c5.523 0 10-4.477 10-10S18.523 3 13 3 3 7.477 3 13s4.477 10 10 10z"></path>
      <path
        fill="#FFF7ED"
        d="M8.996 16.978a1.111 1.111 0 001.582 0l2.395-2.396 2.396 2.396a1.119 1.119 0 001.582-1.583L14.556 13l2.395-2.396a1.12 1.12 0 10-1.582-1.582l-2.396 2.396-2.395-2.396a1.118 1.118 0 10-1.582 1.582L11.39 13l-2.395 2.395a1.11 1.11 0 000 1.583z"
      ></path>
    </svg>
  );
};
