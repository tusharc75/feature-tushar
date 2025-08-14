import { ArrowDropUp, Close } from '@mui/icons-material';
import { Dialog, IconButton, Popper, TextField } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaQuestion } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import RippleButton from 'src/components/RippleButton';
import { HandleSteps } from 'src/components/Walkme/classes';
import { Flow, StepWithAllData } from 'src/components/Walkme/types';
import { CustomDialogTransition } from 'src/constants/helpers';
import { useUrlWithoutMongoId } from 'src/hooks/useUrlWithoutMongoId';

const Walkme = () => {
  const { pathname } = useUrlWithoutMongoId();
  const [walkmeData, setWalkmeData] = useState<Record<string, Flow[]>>({});
  const [currentUrlData, setCurrentUrlData] = useState<Flow[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentStepData, setCurrentStepData] = useState<StepWithAllData | null>(null);
  const handleSteps = useRef<HandleSteps>(null);
  const [arrowRef, setArrowRef] = useState(null);

  useEffect(() => {
    handleSteps.current = new HandleSteps(setCurrentStepData);
    return () => {
      handleSteps.current.destroy();
      setCurrentStepData(null);
    };
  }, []);

  const filteredSteps = useMemo(() => {
    if (!search.trim()) return currentUrlData;
    return currentUrlData.filter((d) => d.flowName.toLowerCase().includes(search.trim().toLowerCase()));
  }, [search, currentUrlData]);

  useEffect(() => {
    const getWalkmeData = async () => {
      try {
        const {
          data: { data }
        } = await axiosInstance().get<{ data: Flow[] }>('/resource-walkme');
        if (data && data.length > 0) {
          const newData = data.reduce(
            (acc, curr) => {
              if (acc[curr.url]) {
                acc[curr.url].push(curr);
              } else {
                acc[curr.url] = [curr];
              }
              return acc;
            },
            {} as Record<string, Flow[]>
          );
          setWalkmeData(newData);
        }
      } catch (error) {
        console.error(error);
      }
    };
    getWalkmeData();
  }, []);

  useEffect(() => {
    if (walkmeData[pathname]) {
      setCurrentUrlData(walkmeData[pathname]);
    } else {
      setCurrentUrlData([]);
    }
  }, [pathname, walkmeData]);

  const isFirstStep = currentStepData && currentStepData._id === currentUrlData[0]?._id;

  return (
    <>
      {currentUrlData.length > 0 && (
        <div className="floating-card fixed bottom-2 left-3 z-[50] transition-all duration-300 min-[960px]:left-[calc(84px+16px)]">
          <HtmlTooltip title={'Walk Me'}>
            <RippleButton
              type="button"
              onClick={() => setOpen(true)}
              className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[white] text-gray-900 shadow-lg transition-all duration-300 [border:1px_solid_var(--common-border-color)] dark:bg-[var(--dark-primary)] dark:text-gray-200 dark:shadow-white/10"
            >
              <FaQuestion className=" block h-5 w-5 text-gray-600 transition-all duration-300  dark:text-gray-200" />
              <span className="sr-only">Walk me</span>
            </RippleButton>
          </HtmlTooltip>
        </div>
      )}
      <Dialog
        open={open}
        slotProps={{
          transition: CustomDialogTransition,
          paper: {
            style: { borderRadius: '16px' }
          }
        }}
        keepMounted
        onClose={() => setOpen(false)}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
        fullWidth
        maxWidth="xs"
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
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
          </div>
          <div className=" mt-4  h-[200px] space-y-3 overflow-y-auto">
            {filteredSteps?.map((intro, index) => (
              <button
                className="flex max-w-fit cursor-pointer items-center gap-2 border-0 bg-transparent text-left font-medium leading-[1.83] text-[#2a3042] shadow-none transition-all hover:gap-3 hover:text-[var(--new-theme-color)] dark:text-[white]"
                key={intro._id}
                onClick={() => {
                  handleSteps.current = new HandleSteps(setCurrentStepData);
                  handleSteps.current?.start(intro.steps);
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
      {currentStepData && currentStepData.target && (
        <Popper
          open={!!currentStepData?.target}
          anchorEl={currentStepData.target}
          modifiers={[
            {
              name: 'arrow',
              enabled: true,
              options: {
                element: arrowRef
              }
            }
          ]}
        >
          <span ref={setArrowRef}>
            <ArrowDropUp fontSize="small" className=" text-[--dark-secondary,white]" />
          </span>
          <div className="relative z-[1302] mt-3 min-w-[300px] max-w-[300px] rounded-md bg-[var(--dark-secondary,white)] p-2 shadow-md">
            <div className="mb-2 flex items-center justify-between gap-2 pb-1 [border-bottom:1px_solid_var(--common-border-color)]">
              {currentStepData.title && <p className=" truncate text-[16px] font-semibold ">{currentStepData.title}</p>}
              <IconButton
                size="small"
                onClick={() => {
                  handleSteps.current.stop();
                  setCurrentStepData(null);
                }}
              >
                <Close />
              </IconButton>
            </div>
            {currentStepData.description && (
              <div className="mb-2 p-2 text-gray-600 [border-bottom:1px_solid_var(--common-border-color)] dark:text-gray-300">
                {currentStepData.description}
              </div>
            )}
            <div className="footer flex justify-between gap-2 ">
              {!isFirstStep ? (
                <ThemeButton
                  disabled={currentStepData.disablePreviousButton}
                  iconForMobile={false}
                  onClick={() => handleSteps.current.prev()}
                  startIcon={<FaArrowLeft size={16} />}
                >
                  Prev
                </ThemeButton>
              ) : (
                <span></span>
              )}
              <ThemeButton
                buttonType="theme"
                iconForMobile={false}
                onClick={() => {
                  handleSteps.current.next(true);
                }}
                endIcon={<FaArrowRight size={16} />}
              >
                {currentStepData.nextButtonName || 'Next'}
              </ThemeButton>
            </div>
          </div>
        </Popper>
      )}
    </>
  );
};

export default Walkme;
