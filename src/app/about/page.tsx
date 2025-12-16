import NewsCard from "@/components/about/news-card";
import TestimonialCarousel from "@/components/about/testimonial-carousel";
import Image from "next/image";
import { newsList } from "@/lib/data";

export default function About() {
  return (
    <main className="bg-white text-[#1A1A1A]">
      {/* Hero Section */}
      <section className="relative w-full h-[420px] overflow-hidden">
        <Image
          src="/images/about/about-hero.jpg"
          alt="Hands Together"
          fill
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center justify-center lg:flex-row lg:justify-between lg:items-start h-full text-white text-center lg:text-left mt-5 lg:mt-48">
          <h2 className="text-4xl lg:text-5xl font-semibold mb-6">Who We Are</h2>

          <p className="max-w-lg leading-7 text-sm">
            Mefie means “my home” and we welcome everyone who wants to feel at
            home in Ghana. We are a cultural and lifestyle platform that
            connects people from all backgrounds to the richness of Ghana,its
            culture, creativity, energy, and spirit. Whether you&apos;re
            Ghanaian, from the diaspora, or simply curious to explore and
            celebrate Ghana, Mefie is your home too.
          </p>
        </div>
      </section>

      {/* Impact Section */}
      <section className="bg-[#F2F5F8] py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Stats */}
          <div className="md:mx-auto lg:mx-0">
            <h3 className="text-3xl lg:text-5xl font-semibold mb-8">
              Our Impact in Numbers
            </h3>
            <p className="max-w-md text-lg lg:text-xl leading-7 mb-10">
              From active listings to community connections, these numbers
              showcase how Mefie empowers businesses, events, and culture across
              the globe.
            </p>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-2xl lg:text-3xl font-bold">12,500+</p>
                <p className="text-sm mt-1">Active Listings</p>
              </div>

              <div>
                <p className="text-2xl lg:text-3xl font-bold">8,000</p>
                <p className="text-sm mt-1">Verified Businesses</p>
              </div>

              <div>
                <p className="text-3xl font-bold">7,000</p>
                <p className="text-sm mt-1">Community Members</p>
              </div>

              <div>
                <p className="text-3xl font-bold">12</p>
                <p className="text-sm mt-1">Countries Represented</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="w-full">
            <Image
              src="/images/about/about-2.jpg"
              alt="Community"
              width={700}
              height={700}
              className="rounded-lg w-full h-[640px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl lg:text-5xl font-semibold mb-3">
            Loved by our customers
          </h3>
          <p className="text-base lg:text-lg text-gray-500 mb-12">
            Hundreds of 5-star reviews of Mefie Directory award winning software
          </p>

          <TestimonialCarousel />
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[#F2F5F8]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-semibold mb-2">Our values</h3>
          <p className="text-xs text-gray-500 mb-12">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Icons */}
            <div className="grid grid-cols-2 gap-12 text-left">
              <div>
                <span className="text-green-600 text-2xl">
                  <Image src="/images/icons/check.svg" alt="check" width={40} height={40} />
                </span>
                <h4 className="font-semibold mt-2">Authenticity</h4>
                <p className="text-base mt-2 text-gray-600">
                  Promoting genuine Ghanaian culture, experiences, and
                  businesses.
                </p>
              </div>

              <div>
                <span className="text-green-600 text-2xl">
                  <Image src="/images/icons/people-1.svg" alt="check" width={40} height={40} />
                </span>
                <h4 className="font-semibold mt-2">Community</h4>
                <p className="text-base mt-2 text-gray-600">
                  Building connections that unite Ghanaians and friends of Ghana
                  worldwide.
                </p>
              </div>

              <div>
                <span className="text-green-600 text-2xl">
                  <Image src="/images/icons/chart.svg" alt="check" width={40} height={40} />
                </span>
                <h4 className="font-semibold mt-2">Empowerment</h4>
                <p className="text-base mt-2 text-gray-600">
                  Supporting local entrepreneurs and amplifying African-owned
                  businesses.
                </p>
              </div>

              <div>
                <span className="text-green-600 text-2xl">
                  <Image src="/images/icons/plane.svg" alt="check" width={40} height={40} />
                </span>
                <h4 className="font-semibold mt-2">Exploration</h4>
                <p className="text-base mt-2 text-gray-600">
                  Inspiring people to discover Ghana through food, culture,
                  events, fashion, and more.
                </p>
              </div>
            </div>

            {/* Right stacked images */}
            <div className="grid grid-cols-2 gap-4">
              <Image
                src="/images/about/grid-1.jpg"
                alt="values-1"
                width={700}
                height={700}
                className="rounded-lg h-[640px] w-full object-cover col-span-1"
              />
              <div className="grid grid-cols-1 gap-4">
              <Image
                src="/images/about/grid-2.jpg"
                alt="values-2"
                width={500}
                height={500}
                className="rounded-lg h-[312px] w-full object-cover"
              />
              <Image
                src="/images/about/grid-3.jpg"
                alt="values-3"
                width={500}
                height={500}
                className="rounded-lg h-[312px] w-full object-cover"
              />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-semibold mb-2">
            News from Mefie Directory
          </h3>
          <p className="text-base text-gray-500 mb-12">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
            {newsList.slice(0, 2).map((news) => (
              <NewsCard
                key={news.id}
                image={news.image}
                category={news.category}
                categoryColor={news.categoryColor}
                date={news.date}
                title={news.title}
                description={news.excerpt}
                link={`/about/${news.id}`}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
