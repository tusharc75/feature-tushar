import { Button, CssBaseline, FormControl, MenuItem, Select } from '@material-ui/core';
import { useState } from 'react';
import { CiLock, CiUnlock } from 'react-icons/ci';
import { SVG } from 'src/assets';
import OtpInput from 'src/components/OtpInput';
import { cn } from 'src/constants/helpers';

type AuthenticationMethods = 'authenticatorApp' | 'emailCode';

const LoginMFA = () => {
  const [selectedMethod, setSelectedMethod] = useState<AuthenticationMethods>('authenticatorApp');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [otp, setOtp] = useState('');

  return (
    <>
      <CssBaseline />
      <div className="flex min-h-screen items-center justify-center bg-[var(--dark-secondary,white)] px-3 py-3">
        <div className="w-full max-w-[500px] rounded-2xl bg-[var(--dark-primary,white)] p-5 text-center shadow-lg [border:1px_solid_var(--common-border-color)]">
          <div className="logo-container mx-auto mb-2 max-w-[150px]">
            <img src={SVG('LogoNew')} alt="equipt logo" className="max-w-full" />
          </div>

          <div
            className={cn(
              'lock relative mx-auto mb-3 flex h-[70px] w-[70px] items-center justify-center rounded-full transition-colors duration-300',
              isCodeValid ? 'bg-green-500/30 dark:bg-green-500/45' : 'bg-red-500/30 dark:bg-red-500/45'
            )}
          >
            {isCodeValid ? (
              <CiUnlock size={35} className="text-black/60 dark:text-white/70" />
            ) : (
              <CiLock size={35} className="text-black/60 dark:text-white/70" />
            )}
          </div>

          <h4 className="mb-3 text-2xl font-semibold">Verify Your Identity</h4>

          <p className="mb-2 font-semibold text-gray-500">Authentication Method</p>
          <FormControl style={{ minWidth: 'min(100%, 300px)' }} size="small" className="mb-3">
            <Select
              variant="outlined"
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={selectedMethod}
              label="Age"
              onChange={(e) => setSelectedMethod(e.target.value as AuthenticationMethods)}
            >
              <MenuItem value={'authenticatorApp'}>Authenticator App</MenuItem>
              <MenuItem value={'emailCode'}>Email Code</MenuItem>
            </Select>
          </FormControl>

          <p className="info mx-auto mb-3 max-w-[400px] text-[13px] font-normal leading-[1.5] text-gray-500">
            An authentication code has been sent to your {selectedMethod === 'authenticatorApp' ? 'device' : 'email'}. Enter the code to continue and
            be redirected.
          </p>
          <div className="mb-4">
            <OtpInput
              validateChar={(character, index) => /^[0-9]$/.test(character)}
              value={otp}
              onChange={(value) => setOtp(value)}
              TextFieldsProps={{ size: 'small' }}
            />
          </div>
          <Button
            disableElevation
            variant="contained"
            color="primary"
            fullWidth
            style={{ paddingBlock: 10, borderRadius: 9 }}
            disabled={otp.length < 6}
          >
            {otp.length < 6 ? `${6 - otp.length} digits left` : isCodeValid ? "Let's go!" : 'Wrong code'}
          </Button>
        </div>
      </div>
    </>
  );
};

export default LoginMFA;
