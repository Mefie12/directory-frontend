"use client";
import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { faqs as staticFaqs } from "@/lib/data";

interface FAQ {
  id: number | string;
  slug?: string;
  question: string;
  answer: string;
}

export function Faqs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faqs", { headers: { Accept: "application/json" } })
      .then((res) => {
        if (!res.ok) throw new Error("API unavailable");
        return res.json();
      })
      .then((data) => {
        const list: FAQ[] = data.data || data.faqs || data || [];
        setFaqs(list.length > 0 ? list : staticFaqs);
      })
      .catch(() => {
        setFaqs(staticFaqs);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-12 items-start">
      {/* Left: Title & description */}
      <div className="col-span-1">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
          Frequently Asked Questions
          <br />
          <span className="text-[#93C01F]">(FAQs)</span>
        </h2>
        <p className="mt-6 text-gray-600 leading-relaxed">
          Here, we&apos;ve answered the most common questions to help vendors
          and customers get the best out of Mefie. Whether you&apos;re listing
          your business or searching for trusted services, this section will
          guide you through every step of the journey.
        </p>
      </div>

      {/* Right: Accordion */}
      <div className="w-full col-span-1">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-gray-200 py-5 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                {i === 0 && <Skeleton className="h-4 w-full mt-2" />}
              </div>
            ))}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.slug || faq.id}
                value={`item-${index}`}
                className="border-b border-gray-200 last:border-b"
              >
                <AccordionTrigger className="py-5 text-left font-semibold text-base text-gray-900 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-gray-600 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
