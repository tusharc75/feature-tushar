import React from 'react';
import { CgExternal } from 'react-icons/cg';
import { footerData } from 'src/pages/UserManual/constants';

const ManualFooter = () => {
  return (
    <div className="bg-[#303846] text-white">
      <div className="container flex justify-around py-[40px]">
        {footerData.map((section) => (
          <div className="">
            <h6 className="mb-4 ml-2 text-[16px] font-bold leading-[1.5]">{section.title}</h6>
            <ul className="list-none px-0 ">
              {section.links.map((link) => (
                <li className="m-2 list-none text-[16px] font-normal leading-[1.25] text-[white]">
                  <a
                    href={link.url}
                    className="mb-3 flex items-center gap-1 text-[16px] font-light hover:text-[var(--new-theme-color)] hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label}
                    <CgExternal size={20} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManualFooter;
