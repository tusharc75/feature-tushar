import { HTMLAttributes, MouseEvent } from 'react';
import { useHistory } from 'react-router-dom';
import { cn } from 'src/constants/helpers';

export type SideCardProps = {
  icon: React.ReactNode;
  heading: string;
  description?: string;
  href?: string;
  external?: boolean;
  gradientColors?: [string, string];
} & HTMLAttributes<HTMLDivElement>;

const SideCard = ({
  icon,
  heading,
  description,
  href,
  onClick,
  external = false,
  gradientColors = ['var(--new-theme-color)', 'var(--new-theme-color)']
}: SideCardProps) => {
  const history = useHistory();
  const handleCLick = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    if (href) {
      if (external) {
        window.open(href, '_blank');
      } else {
        history.push(href);
      }
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      onClick={handleCLick}
      role={onClick ? 'button' : href ? 'link' : 'article'}
      aria-label={onClick ? `open ${heading} modal` : href ? `Open the ${heading} ${external && 'site in a new tab'}` : `${heading}`}
      className={cn('min-h-[130px] rounded-xl ', (onClick || href) && 'cursor-pointer')}
      style={{ background: `linear-gradient(180deg, ${gradientColors[0]}, ${gradientColors[1]})` }}
    >
      <div className="group relative ml-1 min-h-full rounded-xl bg-[var(--dark-primary,white)]  p-[40px_18px_28px_18px] shadow-[0px_3.3px_40px_0px_#00000014]">
        <div className="grid min-h-full gap-2 min-[500px]:grid-cols-[80px_1fr] min-[900px]:grid-cols-1 min-[1024px]:grid-cols-[1fr_3fr] min-[1300px]:grid-cols-[100px_1.5fr] min-[1370px]:grid-cols-[100px_3fr]">
          <div className="min-w-0 max-w-full">{icon}</div>
          <div className="content ">
            <h3 className="mb-[10px] text-[20px] font-semibold leading-[24px]">{heading}</h3>
            <p className="text-[12px] font-normal leading-[14px]">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideCard;
