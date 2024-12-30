import { ThemeButton } from 'src/components/Helpers/Buttons';
import '../sidebar.scss';

function CustomButton(props) {
  const { loading, children, disabled, ...rest } = props;
  return (
    <ThemeButton {...rest} disabled={disabled} buttonType="theme" isLoading={loading}>
      {children}
    </ThemeButton>
  );
}
export default CustomButton;
