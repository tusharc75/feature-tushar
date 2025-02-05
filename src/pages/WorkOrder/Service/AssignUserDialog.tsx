import { Add, Close } from '@mui/icons-material';
import { Avatar, Box, Checkbox, IconButton, Typography } from '@mui/material';
import { isArray } from 'lodash';
import { useCallback, useContext, useEffect, useState } from 'react';
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

const initialClass = ['-right-full', 'opacity-0'];
const delayedClass = ['right-0', 'opacity-100'];

const AssignUserDialog = ({ workOrderData, assignedUsers, reference, referenceData = null, competencies, handleClose, handleSucess, warehouse }) => {
  const toastConfig = useContext(CustomToastContext);
  const [userList, setUserList] = useState<User[]>(null);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>(assignedUsers || []);
  const { className, revertClass } = useDelayedClass(initialClass, delayedClass, 10);
  const [searchedValue, setSearchedValue] = useState('');
  const [isAssignButtonLoading, setIsAssignButtonLoading] = useState(false);

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
    }, 150);
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

  return (
    <>
      <div
        className={cn('backdrop fixed inset-0 z-[1301] cursor-pointer bg-black/50 opacity-0 transition-opacity', className[1])}
        onClick={() => handleClosePanel()}
      />
      <div
        aria-labelledby="customized-dialog-title"
        className={cn(
          'fixed top-0 z-[1301] flex h-dvh w-[--w] flex-col bg-[--dark-primary,white] transition-all [--w:min(100%,470px)]',
          className[0]
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b p-4">
          <h5 className="text-xl font-semibold leading-[24px]">Assign Technician</h5>
          <IconButton size="small" onClick={() => handleClosePanel()}>
            <Close />
          </IconButton>
        </div>
        <div className="flex gap-2 p-[18px]">
          <SearchBox fullWidth value={searchedValue} onChange={handleSearch} />
          <ThemeButton
            buttonType="theme"
            loading={isAssignButtonLoading}
            disabled={selectedUsers.length === 0}
            onClick={(e) => {
              e.preventDefault();
              handleAssignUser();
            }}
            startIcon={<Add />}
          >
            Assign
          </ThemeButton>
        </div>
        <div className="content flex-grow overflow-auto p-[18px] pt-0">
          {userList ? (
            <>
              {userList?.length === 0 ? (
                <Box mb={2}>
                  <Typography>None of the technicians have selected competencies.</Typography>
                </Box>
              ) : (
                <ul className="list-none space-y-2">
                  {filteredUsers.map((user) => (
                    <li className="list-none rounded-md border px-[18px] py-[10px]">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center">
                          <Avatar
                            src={user.avatar}
                            sx={{
                              background: 'transparent'
                            }}
                            className="border !border-[#777575] !text-[#777575] dark:border-gray-300 dark:!text-gray-300"
                          >
                            {user.optionLabel[0].toUpperCase()}
                          </Avatar>
                          <p className="ml-[10px] text-[12px] font-semibold">{user.optionLabel}</p>
                        </div>
                        <Checkbox checked={Boolean(findUser(user))} onChange={() => handleSelect(user)} size="small" />
                      </div>
                      <ul className="flex list-none flex-wrap gap-2">
                        {statusOrder.map((d) => {
                          if (user.status[d] === undefined) return null;
                          return (
                            <li className="flex items-center gap-1 rounded-[5px] border px-[8px] py-[2px] text-[12px] font-normal leading-4">
                              <span className="[&_svg]:block [&_svg]:size-[16px]">{workOrderIconMap[d]}</span>
                              <span>
                                {d} - {user.status[d]}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
            </>
          )}
        </div>
      </div>
    </>
  );
};
export default AssignUserDialog;
