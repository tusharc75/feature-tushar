import { Close } from '@mui/icons-material';
import { Dialog, IconButton, TextField, useMediaQuery } from '@mui/material';
import React, { ReactNode, useEffect, useState } from 'react';
import { FaQuestion } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { AI_AGENT } from 'src/config';
import { SIDEBAR_OPENED_BY_BUTTON, useStore, WALK_ME_STEPS } from 'src/StateProvider/fastContext';
import { cn, CustomDialogTransition } from 'src/constants/helpers';
import { getCurrentUrl } from './helper';

export type WalkmeData = {
  flowName: string;
  type?: 'flow' | 'normal' | undefined;
  steps: StepDefination[];
  url: string;
};

export type StepDefination = {
  title: string;
  description?: string;
  target: string;
  disablePreviousButton?: boolean;
  nextButtonName?: string;
  skipIfValueExist?: boolean;
  targetType: 'buttom' | 'input' | 'div' | 'link' | 'checkbox';
}

const CustomIntroNew = () => {
  const [selectedIntro, setSelectedIntro] = useState<WalkmeData | null>(null);
  const handleStart = (intro: WalkmeData) => {
    console.log('started');
  };

  return <SelectIntro handleStart={handleStart} />;
};

export default CustomIntroNew;

const SelectIntro = ({ handleStart }: { handleStart: (intro: any) => void }) => {
  const [isSidebarOpenedByButton] = useStore((store) => store[SIDEBAR_OPENED_BY_BUTTON]);
  const isMobile = useMediaQuery('(max-width:768px)');
  const location = useLocation();
  const [walkMeSteps] = useStore((store) => store[WALK_ME_STEPS]);
  const [stepsForThisPage, setStepsForThisPage] = useState<any[]>([]);
  const [filteredSteps, setFilteredSteps] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const url = getCurrentUrl();
    const stepsForCurrentPage = walkMeSteps?.filter((d) => url === d?.url);
    setStepsForThisPage(stepsForCurrentPage);
    setFilteredSteps(stepsForCurrentPage);
  }, [walkMeSteps, location]);

  const handleSearch = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim() === '') {
      setFilteredSteps(stepsForThisPage);
    } else {
      const filtered = stepsForThisPage.filter((d) =>
        d.flowName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSteps(filtered);
    }
  };


  if (stepsForThisPage.length === 0 || isMobile) return null;

  return (
    <>
      <div
        className={cn(
          'floating-card fixed bottom-2 left-3 z-[50] transition-all duration-300',
          isSidebarOpenedByButton ? 'min-[960px]:left-[calc(300px+16px)]' : 'min-[960px]:left-[calc(84px+16px)]',
        )}
      >
        <HtmlTooltip className="block" title={'Walk me'}>
          <button
            type="button"
            className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[white] text-gray-900 transition-all duration-300 [border:1px_solid_var(--common-border-color)] hover:h-14 hover:w-14 dark:bg-[var(--dark-primary)] dark:text-gray-200"
            onClick={() => setOpen(true)}
          >
            <span className="sr-only">Walk me</span>
            {!AI_AGENT && (
              <span className="pointer-events-none absolute inset-0 z-[-1] inline-flex h-10 w-10  animate-ping rounded-full bg-sky-400 opacity-75 group-hover:h-14 group-hover:w-14"></span>
            )}
            <FaQuestion className=" block h-5 w-5 text-gray-600 transition-all duration-300 group-hover:h-7 group-hover:w-7 dark:text-gray-200" />
          </button>
        </HtmlTooltip>
      </div>
      <Dialog
        open={open}
        TransitionComponent={CustomDialogTransition}
        keepMounted
        onClose={() => setOpen(false)}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
        fullWidth
        maxWidth="xs"
        PaperProps={{
          style: { borderRadius: '16px' },
        }}
      >
        <div className="p-[24px]">
          <div className="flex justify-between gap-2 pb-[10px] text-[#2a3042] [border-bottom:1px_solid_var(--common-border-color)] dark:text-[white]">
            <h6 className="  text-[17px] font-bold leading-[1.57] ">Select any topic</h6>
            <IconButton onClick={() => setOpen(false)} size="small">
              <Close />
            </IconButton>
          </div>
          <div className="pb-2 pt-3">
            <TextField
              autoFocus
              label="Search topic..."
              type="search"
              variant="outlined"
              size="small"
              fullWidth
              onChange={handleSearch}
              value={search}
            />
          </div>
          <div className=" mt-4  h-[200px] space-y-3 overflow-y-auto">
            {filteredSteps?.map((intro) => (
              <button
                className="flex max-w-fit cursor-pointer items-center gap-2 border-0 bg-transparent text-left font-medium leading-[1.83] text-[#2a3042] shadow-none transition-all hover:gap-3 hover:text-[var(--new-theme-color)] dark:text-[white]"
                key={intro.flowName}
                onClick={() => {
                  handleStart(intro);
                  setOpen(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M6.50049 0H13.0005V6.5H12.188V1.39014L0.59082 12.981L0.0195312 12.4097L11.6104 0.8125H6.50049V0Z"
                    fill="currentcolor"
                    stroke="currentcolor"
                  ></path>
                </svg>
                {intro.flowName}
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </>
  );
};