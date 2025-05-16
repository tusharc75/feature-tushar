import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, Popover } from '@mui/material';
import { camelCase } from 'lodash';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { FiExternalLink } from 'react-icons/fi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { sidebarResource } from 'src/constants/helpers';

const DetailsPopover = ({ setShowDetail, showDetail, resourceList, selectedResource, fields, resourceDatas }) => {
  return (
    <Popover
      open={true}
      anchorPosition={{
        top: showDetail.anchor.clientY,
        left: showDetail.anchor.clientX
      }}
      slotProps={{
        paper: { sx: { width: 'min(600px, 100%)' } }
      }}
      anchorEl={showDetail.anchor}
      anchorReference={showDetail.anchor.clientY ? 'anchorPosition' : 'anchorEl'}
      anchorOrigin={{
        vertical: 'center',
        horizontal: 'right'
      }}
      transformOrigin={{
        vertical: 'center',
        horizontal: 'left'
      }}
      onClose={() => {
        setShowDetail({ open: false, data: null, anchor: null });
      }}
    >
      <Box className=" w-[min(600px,100%)] space-y-2 p-2">
        <div className="flex items-center justify-between gap-1 border-b p-2">
          <div className="flex items-center gap-1">
            <h5 className="text-sm">{`${showDetail?.data?.title}`}</h5>
            <IconButton
              size="small"
              onClick={() => {
                if (showDetail?.data?.resource) {
                  const resource = resourceList?.find((r) => r.resource === showDetail?.data?.resource);
                  window.open(`${resource.path}/${showDetail?.data?.id}`);
                } else {
                  let path = selectedResource.path;
                  if (selectedResource.resource === sidebarResource.serializedAsset) {
                    path = routes[`${camelCase(showDetail?.data?.resource)}Detail`]?.path;
                  }
                  window.open(`${path}/${showDetail?.data?.id}`);
                }
              }}
              className="close-icon-v1"
            >
              <FiExternalLink fontSize="medium" />
            </IconButton>
          </div>
          <HtmlTooltip title="Close">
            <IconButton size="small" onClick={() => setShowDetail({ open: false, data: null, anchor: null })} className="close-icon-v1">
              <CloseIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        </div>
        <div className="h-[300px] overflow-x-auto overflow-y-auto">
          <RenderDetail fields={fields} data={resourceDatas?.find((r) => r?._id === showDetail?.data?.id)} />
        </div>
      </Box>
    </Popover>
  );
};

export default DetailsPopover;

const RenderDetail = ({ fields, data }) => {
  return (
    <div className="min-w-[430px]">
      {!data || !fields?.length ? (
        <div className="max-w-[430px] p-2">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </div>
      ) : (
        <DetailsPage data={data} fields={fields} defaultColumnCount={2} />
      )}
    </div>
  );
};
