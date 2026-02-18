import Image from "next/image";

type PaymentMethodCardProps = {
  imageSrc: string;
  title: string;
  description: string;
  surcharge?: string;
};

export function PaymentMethodCard({ imageSrc, title, description, surcharge }: PaymentMethodCardProps) {
  return (
    <div className="group rounded-2xl border border-white/35 bg-white/8 p-2.5 text-center shadow-sm backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1">
      <div className="mx-auto overflow-hidden rounded-xl border border-white/40 bg-white/10 shadow-sm">
        <Image
          src={imageSrc}
          alt={title}
          width={768}
          height={512}
          className="h-36 w-full object-cover sm:h-40"
          loading="lazy"
        />
      </div>
      <p className="mt-2 font-display text-base font-semibold leading-tight text-white">{title}</p>
      <p className="mt-0.5 text-[0.72rem] font-sans leading-snug text-white/85">{description}</p>
      {surcharge && (
        <p className="mt-0.5 text-[0.62rem] font-semibold text-[var(--gd-color-orange)]">{surcharge}</p>
      )}
    </div>
  );
}
