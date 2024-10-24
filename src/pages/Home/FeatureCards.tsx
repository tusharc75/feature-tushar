import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import EquiptAiImage from 'src/assets/svg/home/EquiptAi.svg';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const equiptAiData = {
  src: EquiptAiImage,
  heading: routes.equiptAi.title,
  description: `Equipt AI enhances productivity by automating tasks and providing insights through advanced machine learning.`,
  href: routes.equiptAi.path,
  buttonText: 'Try Now '
};

const FeatureCard = () => {
  const {
    state: { permissions }
  } = useData();
  const aiPermission = permissions?.equiptAi;

  if (!aiPermission?.isRead) return null;
  return (
    <div className="gap mb-4 grid grid-cols-1 gap-4">
      {aiPermission?.isRead && <SingleCard {...equiptAiData} />}
    </div>
  );
};

type SingleCardProps = {
  src: string;
  heading: string;
  description: string;
  href: string;
  buttonText: string;
};

const SingleCard = ({ src, heading, description, href, buttonText }: SingleCardProps) => {
  return (
    <div className="grid min-h-[178px] grid-cols-[1fr_1.5fr] items-center rounded-xl bg-[var(--dark-primary,white)] shadow-[0px_3.3px_40px_0px_#00000014] [border-left:4px_solid_var(--new-theme-color)] min-[900px]:grid-cols-1 min-[1024px]:grid-cols-[1fr_3fr] min-[1300px]:grid-cols-[1fr_1.5fr] min-[1370px]:grid-cols-[203px_1fr]">
      <div className="image flex min-w-0 max-w-full items-center justify-center px-2">
        <img src={src} alt={heading} className="block min-w-0" />
      </div>
      <div className="content p-[15px_20px_15px_15px]">
        <h3 className="mb-[10px] text-[20px] font-semibold leading-[24px]">{heading}</h3>
        <p className=" mb-[27px] text-[12px] font-normal leading-[14px]">{description}</p>
        <Link to={href}>
          <ThemeButton borderColor="none" color="primary" iconForMobile={false} endIcon={<HiOutlineExternalLink />}>
            {buttonText}
          </ThemeButton>
        </Link>
      </div>
    </div>
  );
};

export default FeatureCard;
