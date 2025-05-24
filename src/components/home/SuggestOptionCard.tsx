// src/components/home/SuggestOptionCard.tsx
"use client";

import Image from 'next/image'; // Eğer buton içinde imaj varsa

interface SuggestOptionCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonIconSrc?: string; // Opsiyonel ikon src
  onButtonClick: () => void;
  isPrimaryAction?: boolean; // Buton stilini belirlemek için
}

const SuggestOptionCard: React.FC<SuggestOptionCardProps> = ({
  title,
  description,
  buttonText,
  buttonIconSrc,
  onButtonClick,
  isPrimaryAction = false,
}) => {
  const buttonBaseClasses = "btn-suggest-action inline-flex items-center gap-2 py-2.5 px-5 text-sm rounded-md mb-3 transition-all duration-200 hover:-translate-y-0.5";
  const primaryButtonClasses = "bg-suggest-btn-primary-bg text-suggest-btn-primary-text border-none hover:bg-suggest-btn-primary-hover-bg";
  const secondaryButtonClasses = "bg-suggest-btn-secondary-bg text-suggest-btn-secondary-text border border-suggest-btn-secondary-border hover:bg-suggest-btn-secondary-hover-bg";

  return (
    <div className="suggest-option-card bg-suggest-card-bg p-6 rounded-lg border border-suggest-card-border shadow-suggest-card text-center flex flex-col items-center">
      <h3 className="suggest-option-title text-xl font-semibold text-suggest-card-title mb-4">
        {title}
      </h3>
      <button
        onClick={onButtonClick}
        className={`${buttonBaseClasses} ${isPrimaryAction ? primaryButtonClasses : secondaryButtonClasses}`}
      >
        {buttonIconSrc && (
          <Image src={buttonIconSrc} alt="" width={16} height={16} className="btn-icon w-4 h-4 object-contain" />
        )}
        {buttonText}
      </button>
      <p className="suggest-option-description text-xs text-suggest-card-description leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default SuggestOptionCard;