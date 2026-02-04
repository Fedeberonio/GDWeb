import Image from "next/image";

type PaymentMethodCardProps = {
  imageSrc: string;
  title: string;
  description: string;
  surcharge?: string;
};

export function PaymentMethodCard({ imageSrc, title, description, surcharge }: PaymentMethodCardProps) {
  return (
    <div className="group rounded-xl bg-[#F5F1E8] p-6 text-center shadow-sm transition-transform duration-200 hover:-translate-y-1">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Image
          src={imageSrc}
          alt={title}
          width={96}
          height={96}
          className="h-14 w-14 object-contain"
          loading="lazy"
        />
      </div>
      <p className="font-display text-lg font-semibold text-[var(--gd-color-forest)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--gd-color-forest)]/80 font-sans">{description}</p>
      {surcharge && (
        <p className="mt-2 text-xs font-semibold text-[var(--gd-color-orange)]">{surcharge}</p>
      )}
    </div>
  );
}
