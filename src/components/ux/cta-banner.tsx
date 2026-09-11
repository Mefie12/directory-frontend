import Image from "next/image";
import { Button } from "@/components/ui/button";

/**
 * The navy "Ready to …?" call-to-action banner at the bottom of the home,
 * discover, communities and events pages. One component so those pages can't
 * drift apart again.
 */
export function CtaBanner({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="py-12 px-4 lg:px-16">
      <div className="relative flex flex-col justify-center items-center text-center bg-[#152B40] text-white rounded-3xl overflow-hidden h-[350px] shadow-sm px-20 lg:px-0">
        {/* Decorative background patterns */}
        <div
          aria-hidden="true"
          className="absolute -left-32 lg:-left-6 lg:-bottom-20"
        >
          <Image
            src="/images/backgroundImages/bg-pattern.svg"
            alt=""
            width={320}
            height={320}
            className="object-contain h-[150px] lg:h-[400px]"
          />
        </div>
        <div
          aria-hidden="true"
          className="hidden lg:block absolute bottom-20 lg:-bottom-20 -right-24 lg:right-0"
        >
          <Image
            src="/images/backgroundImages/bg-pattern-1.svg"
            alt=""
            width={320}
            height={320}
            className="object-contain"
          />
        </div>
        <div
          aria-hidden="true"
          className="block lg:hidden absolute bottom-16 -right-32"
        >
          <Image
            src="/images/backgroundImages/mobile-pattern.svg"
            alt=""
            width={320}
            height={320}
            className="object-contain h-[120px]"
          />
        </div>

        {/* `relative` keeps the text and button painted above the patterns. */}
        <h2 className="relative text-3xl md:text-5xl font-bold leading-tight mb-4">
          {title}
        </h2>
        <Button
          onClick={onAction}
          className="relative bg-[#93C01F] hover:bg-[#7ea919] text-white font-medium text-base px-4 py-2 rounded-md transition-all duration-200 mt-3 cursor-pointer"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
