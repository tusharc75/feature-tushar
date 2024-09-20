import type { TextFieldProps as MuiTextFieldProps } from '@material-ui/core/TextField';

type TextFieldProps = Omit<MuiTextFieldProps, 'onChange' | 'select' | 'multiline' | 'defaultValue' | 'value' | 'autoFocus' | 'variant'>;

type BoxProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'onBlur'>;

export interface BaseMuiOtpInputProps {
  value?: string;
  length?: number;
  autoFocus?: boolean;
  TextFieldsProps?: (TextFieldProps & { pattern?: string }) | ((index: number) => TextFieldProps);
  onComplete?: (value: string) => void;
  validateChar?: (character: string, index: number) => boolean;
  onChange?: (value: string) => void;
  onBlur?: (value: string, isCompleted: boolean) => void;
  ref?: React.MutableRefObject<HTMLInputElement | null>;
}

export type OtpInputProps = BoxProps & BaseMuiOtpInputProps;
