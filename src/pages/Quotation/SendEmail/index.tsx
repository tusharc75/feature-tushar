import Box from '@mui/material/Box/Box';
import { Button } from '@mui/material';
import { sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { GiReceiveMoney } from 'react-icons/gi';
import { VscVersions } from 'react-icons/vsc';
import PreviewDownload from 'src/components/PreviewDownload';
import routes from 'src/components/Helpers/Routes';

const SendEmail = ({
  quotationData,
  versionId,
  columns,
  currentVersion,
  setShowAllVersionStatus = null,
  setShowQuotationSummaryDialog = null,
  hideSummary = false,
  hideVersions = false
}) => {
  const {
    state: { user, permissions, resources }
  }: any = useData();

  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <Box display="flex" flexWrap={'wrap'} gridGap={8}>
            {!hideSummary && (
              <Button
                onClick={() => {
                  setShowQuotationSummaryDialog(true);
                }}
                variant="outlined"
                size="small"
                startIcon={<GiReceiveMoney />}
                color="primary"
              >
                Summary
              </Button>
            )}
            {!hideVersions && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'outlined'}
                color="primary"
                size="small"
                className={'btn-outline-v1'}
                onClick={() => {
                  setShowAllVersionStatus(true);
                }}
                style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                startIcon={isMobile && !isTablet ? null : <VscVersions />}
              >
                {isMobile && !isTablet ? <VscVersions size={20} /> : `Version : ${currentVersion}`}
              </Button>
            )}
            <PreviewDownload
              fileName={`${resources?.quotation?.titleSingular}-${quotationData?.quotationNumber}`}
              resource={sidebarResource.quotation}
              referenceId={quotationData?._id}
              columns={columns}
              isSendEmail={true}
              isExcelDownload={true}
              subject={`${user?.user?.brandName} Offer - ${quotationData?.quotationNumber}`}
              extraQueryParams={{ uniqueId: versionId }}
              defaultColumns={[
                'index',
                'type',
                'detail',
                'description',
                'qty',
                `price_${quotationData?.currency?.toLowerCase()}`,
                `totalPrice_${quotationData?.currency?.toLowerCase()}`,
                `tax_${quotationData?.currency?.toLowerCase()}`,
                `finalPrice_${quotationData?.currency?.toLowerCase()}`
              ]}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default SendEmail;
