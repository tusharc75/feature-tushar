import React from 'react';

type SvgProps = {
  size?: number;
} & React.SVGProps<SVGSVGElement>;

export const HomeIconBreadcrumb = ({ size = 18, ...rest }: SvgProps) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 18} height={size || 18} fill="none" viewBox="0 0 18 18" {...rest}>
      <path
        stroke="#0DA0A8"
        strokeLinecap="round"
        strokeWidth="1.3"
        d="M4.467 3.074C2.348 4.647 1.29 5.434.873 6.596a4 4 0 0 0-.09.283c-.331 1.19.073 2.462.882 5.008.81 2.545 1.214 3.818 2.167 4.581q.114.092.235.175c1.005.69 2.315.69 4.933.69 2.619 0 3.928 0 4.933-.69q.121-.083.236-.175c.952-.763 1.357-2.036 2.166-4.581.81-2.546 1.214-3.818.883-5.008a4 4 0 0 0-.09-.283c-.416-1.162-1.476-1.949-3.594-3.522C11.415 1.501 10.356.714 9.146.67a4 4 0 0 0-.291 0c-1.21.046-2.27.832-4.388 2.405Zm2.944 9.828a.603.603 0 0 0-.595.609c0 .336.266.609.595.609h3.178a.6.6 0 0 0 .596-.61.603.603 0 0 0-.596-.608z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};
