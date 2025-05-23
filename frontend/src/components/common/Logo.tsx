import { youth } from '@/assets/images';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const Logo = ({ size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  };

  return (
    <div className="flex items-center">
      <img 
        src={youth.logo} 
        alt="Logo Đoàn" 
        className={`${sizeClasses[size]} mr-3`} 
      />
      <div>
        <h1 className={`font-heading font-bold text-primary-700 ${
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
        }`}>
          ĐOÀN TNCS HỒ CHÍ MINH
        </h1>
        <p className={`text-secondary-600 ${
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        }`}>
          Trường Đại học XYZ
        </p>
      </div>
    </div>
  );
};

export default Logo; 