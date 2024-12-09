import { IconButton } from '@material-ui/core';
import { RiMenu2Fill } from 'react-icons/ri';
import Logo from 'src/assets/svg/logoNew.svg';
import { MoonIcon, SunIcon } from 'src/assets/svg/svgIcons';
import { useAppTheme } from 'src/constants/AppConfig';
import { SearchBar } from 'src/pages/UserManual/SearchBar';
import { ComponentCommonProps } from 'src/pages/UserManual/type';

const ManualNav = ({ state }: ComponentCommonProps) => {
  const { toggleSidebar, navigate, isMobile } = state;
  const [themeColor, toggleThemeColor] = useAppTheme();

  return (
    <nav className="sticky top-0 z-50 flex h-[--manual-head-height] items-center justify-between bg-[white] px-4 py-2 [border-bottom:1px_solid_var(--common-border-color)] dark:bg-[#242526]">
      <div className="flex items-center gap-4">
        {isMobile && (
          <IconButton
            color="inherit"
            size="small"
            style={{ padding: 8, border: '1px solid var(--common-border-color)', borderRadius: 5 }}
            onClick={toggleSidebar}
          >
            <RiMenu2Fill />
          </IconButton>
        )}
        <div onClick={() => navigate('/')} className="flex cursor-pointer items-center gap-2 hover:text-[--new-theme-color]">
          <img src={Logo} alt="logo" className="max-h-[32px] " />
          <span className="font-semibold transition-colors">User Manual</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
      <SearchBar state={state} />
      <IconButton
        onClick={() => {
          toggleThemeColor();
        }}
        size="small"
        style={{ padding: 5 }}
        aria-describedby={`current theme ${themeColor}`}
        aria-label="Them switcher"
        color="inherit"
      >
        {themeColor === 'light' ? <MoonIcon /> : <SunIcon />}
      </IconButton>
      </div>
    </nav>
  );
};

export default ManualNav;
