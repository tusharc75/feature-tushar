import Box from '@mui/material/Box/Box';
import { sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { GiReceiveMoney } from 'react-icons/gi';
import { VscVersions } from 'react-icons/vsc';
import PreviewDownload from 'src/components/PreviewDownload';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
          <Box display="flex" flexWrap={'wrap'} gap={8}>
            {!hideSummary && (
              <ThemeButton
                onClick={() => {
                  setShowQuotationSummaryDialog(true);
                }}
                startIcon={<GiReceiveMoney />}
                mobileTooltip={`Summary`}
                iconForMobile={<GiReceiveMoney size={20} />}
              >
                Summary
              </ThemeButton>
            )}
            {!hideVersions && (
              <ThemeButton
                onClick={() => {
                  setShowAllVersionStatus(true);
                }}
                startIcon={<VscVersions />}
                mobileTooltip={`Version : ${currentVersion}`}
                iconForMobile={<VscVersions size={20} />}
              >
                {`Version : ${currentVersion}`}
              </ThemeButton>
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
