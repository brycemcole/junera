import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
  
  const items = [
    {
      id: "1",
      title: "How do you source the job postings?",
      content:
        "TOS violations. Kidding, but I aggregate job postings from a few thousand different sources, including public APIs, job boards, company career pages, and staffing agencies.",
    },
    {
      id: "2",
      title: "How can I contribute to the website?",
      content:
        "You can contribute through our github repository on the about page, or you can contact me directly through my twitter @br3dev.",
    },
    {
      id: "3",
      title: "How did you create the website?",
      content:
        "Next.js, React, PostgreSQL for the DB and Azure for hosting.",
    },
  ];
  
  export default function IntroAccordion() {
    return (
      <div className="space-y-4">
        <Accordion type="single" collapsible className="w-full -space-y-px" defaultValue="3">
          {items.map((item) => (
            <AccordionItem
              value={item.id}
              key={item.id}
              className="border bg-background px-4 py-1 first:rounded-t-lg last:rounded-b-lg"
            >
              <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="pb-2 text-muted-foreground">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  }
  