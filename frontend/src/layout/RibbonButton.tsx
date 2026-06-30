import { CatholicIcon } from '../components/decorative/CatholicIcon';
import type { CatholicIconName } from '../components/decorative/CatholicIcon';

type RibbonButtonProps = {
  icon: CatholicIconName;
  label: string;
  description?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export function RibbonButton({ icon, label, description, active = false, disabled = false, onClick }: RibbonButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group flex min-w-24 flex-col items-center justify-center rounded-lg border px-3 py-2 text-center transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? 'border-[#D4AF37] bg-[#FFF9EE]'
          : 'border-transparent hover:border-[#D8C8A2] hover:bg-[#FFF9EE]'
      }`}
      title={description ?? label}
    >
      <span className={`mb-1 flex h-9 w-9 items-center justify-center rounded-md transition ${
        active
          ? 'bg-[#0F3D2E] text-[#F4E8C8]'
          : 'bg-[#F4E8C8] text-[#0F3D2E] group-hover:bg-[#0F3D2E] group-hover:text-[#F4E8C8]'
      }`}>
        <CatholicIcon name={icon} className="h-5 w-5" />
      </span>
      <span className="text-xs font-semibold text-[#1F2933]">{label}</span>
    </button>
  );
}
