import { Star } from "lucide-react";
import Image from "next/image";
// Adjust the import path based on where your Avatar component is located
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

type TestimonialCardProps = {
  image?: string; // Make image optional
  name: string;
  message: string;
  review: string;
  stars?: number;
  initials?: string; // Add initials prop
};

export default function TestimonialCard(props: TestimonialCardProps) {
  const { image, name, message, review, stars = 5, initials } = props;

  return (
    <div className="bg-[#F0F0F0] rounded-xl border border-gray-200 p-6 text-left shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        {/* Replaced Next Image with Avatar component */}
        <Avatar
          className="w-14 h-14"
        >
          {image && <AvatarImage src={image} alt={name} className="object-cover" />}
          <AvatarFallback className="flex items-center justify-center bg-gray-300 text-gray-700 font-medium text-lg rounded-full w-full h-full">
            {initials || name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-lg">{message}</p>
          <span className="text-base text-gray-500">{name}</span>
        </div>
      </div>

      {/* Keeping this Image as it is for the quote icon */}
      <Image
        src="/images/icons/quote.svg"
        alt="quote icon"
        width={56}
        height={56}
        className="w-14 h-14 rounded-full object-cover mx-auto mb-4"
      />

      <p className="text-lg text-gray-600 leading-6 mb-6">{review}</p>

      <div className="flex gap-1 text-lg">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="fill-yellow-500 text-yellow-500" />
        ))}
      </div>
    </div>
  );
}