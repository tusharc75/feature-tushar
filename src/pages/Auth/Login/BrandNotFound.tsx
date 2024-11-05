import React from 'react';
import { Logo } from 'src/assets/authenticationAssets';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { backendApi } from 'src/config';

const mainSiteUrl = new URL(backendApi).origin;

const BrandNotFound = () => {
  return (
    <div className="flex min-h-screen items-center px-4 ">
      <div className="mx-auto w-[min(100%,600px)] max-w-2xl rounded-md bg-[var(--dark-primary,white)] px-5 py-8 text-center [border:1px_solid_var(--common-border-color)]">
        <Logo className="mb-4 max-h-[60px] !max-w-[150px]" />
        <pre className="mx-auto mb-4 max-w-fit rounded-md bg-red-100 p-1 dark:bg-red-900">
          <span className=" select-none">🔌</span>
          {window.location.host}
          <span className="select-none">&nbsp;&nbsp;</span>
        </pre>
        <p className="mx-auto mb-8 max-w-[450px] text-[15px]">
          You've requested a page using an invalid hostname. Please double check the web address or try the address of our main site:
        </p>
        <a className="link block" href={mainSiteUrl}>
          <ThemeButton iconForMobile={false} color="primary" borderColor="none" fullWidth style={{ paddingBlock: '10px', fontSize: '14px' }}>
            Our main site
          </ThemeButton>
        </a>
      </div>
    </div>
  );
};

export default BrandNotFound;
