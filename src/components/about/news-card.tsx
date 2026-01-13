import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type NewsCardProps = {
  image: string;
  category: string;
  categoryColor?: string;
  date: string;
  title: string;
  description: string;
  link: string;
};

export default function NewsCard(props: NewsCardProps) {
  const {
    image,
    category,
    date,
    title,
    description,
    link,
    categoryColor = "bg-green-100 text-green-700",
  } = props;

  return (
    <div className="group cursor-pointer flex flex-col h-full">
      <Link href={link} className="block overflow-hidden rounded-2xl mb-4">
        <div className="relative h-[280px] lg:h-80 w-full">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // Simple fallback on load error
              e.currentTarget.srcset = "/images/placeholders/generic-news.jpg";
            }}
          />
        </div>
      </Link>

      <div className="flex items-center justify-between text-xs mb-3">
        <span
          className={`${categoryColor} px-3 py-1.5 rounded-full font-medium text-xs`}
        >
          {category}
        </span>
        <span className="text-gray-500 font-medium">{date}</span>
      </div>

      <Link href={link} className="block">
        <h4 className="font-semibold text-left text-xl mb-2 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {title}
        </h4>
      </Link>

      <p className="text-left text-base text-gray-600 leading-relaxed mb-4 line-clamp-3 grow">
        {description}
      </p>

      <Link
        href={link}
        className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:gap-2 transition-all mt-auto"
      >
        Read more
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
