import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/data";

export function Faqs() {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full space-y-3"
      defaultValue="item-1"
    >
      {faqs.map((faq, index) => (
        <AccordionItem
          key={index}
          value={faq.id}
          className="border rounded-lg shadow-xs bg-white text-center"
        >
          <AccordionTrigger className="px-6 py-4 font-semibold text-lg text-gray-900 hover:no-underline">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 text-gray-600 text-base leading-relaxed">
            <p className="text-left">{faq.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
