import { CheckBoxOutlined, Close } from '@mui/icons-material';
import { Avatar, Box, Checkbox, FormControlLabel, IconButton, Typography } from '@mui/material';
import { isArray } from 'lodash';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaUser } from 'react-icons/fa';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn, workOrder, WORKORDER_SERVICE_STATUS, workOrderIconMap } from 'src/constants/helpers';
import { useDelayedClass } from 'src/hooks';

const statusOrder = [
  WORKORDER_SERVICE_STATUS.planned,
  WORKORDER_SERVICE_STATUS.pending,
  WORKORDER_SERVICE_STATUS.inProgress,
  WORKORDER_SERVICE_STATUS.inProgressByOther,
  WORKORDER_SERVICE_STATUS.completed,
  WORKORDER_SERVICE_STATUS.skipped
] as const;

type User = {
  optionLabel?: string;
  optionValue?: string;
  avatar?: string;
  status?: Status;
};
type StatusOrder = (typeof statusOrder)[number];
type Status = {
  [K in StatusOrder]: number;
};

const initialClass = ['-right-[--w]', 'opacity-0'];
const delayedClass = ['right-0', 'opacity-100'];
const ANIMATION_DURATION = 300;

const AssignTechniciansDialog = ({ workOrderData, assignedUsers, reference, referenceData = null, competencies, handleClose, handleSucess, warehouse }) => {
  const toastConfig = useContext(CustomToastContext);
  const [userList, setUserList] = useState<User[]>(null);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>(assignedUsers || []);
  const { className, revertClass } = useDelayedClass(initialClass, delayedClass, 10);
  const [searchedValue, setSearchedValue] = useState('');
  const [isAssignButtonLoading, setIsAssignButtonLoading] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLDivElement>(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'assign-user-panel';
    setContainerRef(container);
    document.body.appendChild(container);
    document.body.style.overflow = 'hidden';
    if (document.body.scrollHeight > window.innerHeight) {
      document.body.style.paddingRight = `6px`;
    }

    return () => {
      document.body.removeChild(container);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  useEffect(() => {
    fetchUserList();
  }, []);

  const fetchUserList = () => {
    var api = `${workOrder.api}/technician-users?warehouse=${warehouse}`;
    if (competencies && isArray(competencies) && competencies?.length) {
      api = api + `&competencies=${JSON.stringify(competencies)}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        const updatedData = data?.map((d) => {
          const newData = d;
          newData['status'] = d['status'].reduce((acc, curr) => {
            acc[curr['status']] = curr.count;
            return acc;
          }, {});
          return newData;
        });
        setUserList(updatedData);
        setFilteredUsers(updatedData);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleClosePanel = (callback?: () => void) => {
    revertClass();
    setTimeout(() => {
      if (typeof callback === 'function') {
        callback();
      } else {
        handleClose();
      }
    }, ANIMATION_DURATION);
  };

  const handleAssignUser = () => {
    const data: any = {
      users: selectedUsers?.map((d) => d.optionValue)
    };
    let api = workOrder.api;
    if (reference === 'service') {
      api = `${api}/service/assign-user`;
      data.workOrder = workOrderData;
    } else if (reference === 'steps') {
      api = `${api}/step/assign-user`;
      data.workOrderId = workOrderData?.workOrderId;
      data.stepId = referenceData?.stepId;
      data.serviceUniqueId = referenceData?.serviceUniqueId;
    }
    setIsAssignButtonLoading(true);

    axiosInstance()
      .put(api, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        handleClosePanel(handleSucess);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      })
      .finally(() => {
        setIsAssignButtonLoading(false);
      });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalValue = e.target.value;
    setSearchedValue(originalValue);
    const filteredUsers = userList?.filter((d) => d.optionLabel.toUpperCase().includes(originalValue.toUpperCase()));
    setFilteredUsers(filteredUsers);
  };

  const findUser = useCallback(
    (data: User) => {
      return selectedUsers.find((d) => d?.optionValue === data.optionValue);
    },
    [selectedUsers]
  );

  const handleSelect = useCallback(
    (data: User) => {
      const foundedUser = findUser(data);
      let newSelectedUsers: User[] = [...selectedUsers];
      if (foundedUser) {
        newSelectedUsers = newSelectedUsers.filter((d) => d.optionValue !== data.optionValue);
      } else {
        newSelectedUsers.push(data);
      }
      setSelectedUsers(newSelectedUsers);
    },
    [findUser, selectedUsers]
  );

  const isAllSelected = useMemo(() => selectedUsers?.length === userList?.length, [selectedUsers?.length, userList?.length]);
  const indeterminate = useMemo(() => !isAllSelected && selectedUsers.length > 0, [isAllSelected, selectedUsers.length]);
  const handleCheckAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(userList);
    }
  }, [isAllSelected, userList]);

  if (!containerRef) return null;
  return createPortal(
    <>
      <div
        aria-hidden="true"
        className={cn(
          'backdrop fixed inset-0 z-[1300] cursor-pointer bg-black/50 opacity-0 transition-opacity [backdrop-filter:blur(1px)] dark:bg-white/15',
          className[1]
        )}
        onClick={() => handleClosePanel()}
        style={{ transitionDuration: `${ANIMATION_DURATION}ms` }}
      />
      <div
        aria-labelledby="customized-dialog-title"
        className={cn(
          'fixed top-0 z-[1300] flex h-dvh w-[--w] flex-col bg-[--dark-primary,white] transition-all [--w:min(100%,470px)]',
          className[0]
        )}
        style={{ transitionDuration: `${ANIMATION_DURATION}ms` }}
      >
        <div className="flex items-center justify-between gap-2 border-b p-4">
          <h5 className="text-xl font-semibold leading-[24px]">Assign Technicians</h5>
          <IconButton size="small" onClick={() => handleClosePanel()}>
            <Close />
          </IconButton>
        </div>
        <div className="flex gap-2 p-[18px]">
          <SearchBox fullWidth value={searchedValue} onChange={handleSearch} />
          <ThemeButton
            buttonType="theme"
            isLoading={isAssignButtonLoading}
            onClick={(e) => {
              e.preventDefault();
              handleAssignUser();
            }}
          >
            Save
          </ThemeButton>
        </div>
        <div className="px-[18px] text-right">
          <span className="mr-[30px]">
            <FormControlLabel
              control={
                <Checkbox
                  onChange={() => handleCheckAll()}
                  checked={isAllSelected}
                  indeterminate={indeterminate}
                  indeterminateIcon={<CheckBoxOutlined />}
                  size={'small'}
                />
              }
              labelPlacement="start"
              label={<span className="select-none">Select All</span>}
            />
          </span>
        </div>
        <div className="content relative flex-grow overflow-auto p-[18px] pt-0">
          {userList ? (
            <>
              {userList?.length === 0 ? (
                <Box mb={2}>
                  <Typography>None of the technicians have selected competencies.</Typography>
                </Box>
              ) : filteredUsers.length > 0 ? (
                <ul className="list-none space-y-2">
                  {filteredUsers.map((user) => (
                    <li className="list-none rounded-md border px-[18px] py-[10px]">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center">
                          <Avatar src={user.avatar} sx={{ width: 30, height: 30 }}>
                            <FaUser size={15} />
                          </Avatar>
                          <p className="ml-[10px] text-[14px] font-semibold">{user.optionLabel}</p>
                        </div>
                        <Checkbox checked={Boolean(findUser(user))} onChange={() => handleSelect(user)} size="small" />
                      </div>
                      <ul className="flex list-none flex-wrap gap-2">
                        {statusOrder.map((d) => {
                          if (user.status[d] === undefined) return null;
                          return (
                            <li className="flex items-center gap-1 rounded-[5px] border px-[8px] py-[2px]  text-[12px] font-normal leading-4">
                              <span className="[&_svg]:block [&_svg]:size-[16px]">{workOrderIconMap[d]}</span>
                              <span className="text-[14px]">
                                {d} - {user.status[d]}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="absolute inset-0 flex select-none items-center justify-center">
                  <p className="text-gray-400 dark:text-gray-600">No Technicians found</p>
                </div>
              )}
            </>
          ) : (
            <>
              <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
            </>
          )}
        </div>
      </div>
    </>,
    containerRef,
    'modal'
  );
};
export default AssignTechniciansDialog;
