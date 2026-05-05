import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/data";

export function Faqs() {
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
      <Accordion type="single" collapsible className="w-full col-span-1" defaultValue="item-1">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={faq.id}
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
    </div>
  );
}
