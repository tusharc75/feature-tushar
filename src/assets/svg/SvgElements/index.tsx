import DispatchUser from 'src/assets/svg/SvgElements/DispatchUser';
import ReceiveUser from 'src/assets/svg/SvgElements/ReceiveUser';

export type SvgInterface = React.SVGAttributes<SVGElement>;
export type SvgPropsWithSize = {
  size?: number;
} & SvgInterface;

export { DispatchUser, ReceiveUser };
