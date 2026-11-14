import { ChevronDown } from "lucide-react";

export function AccordionList({ items }: { items: { q: string; a: string }[] }) {
  return <div className="accordion-list">{items.map((item, index) => <details className="accordion-item" key={item.q}><summary><span className="accordion-index">0{index + 1}</span><span>{item.q}</span><ChevronDown size={18} /></summary><div className="accordion-answer"><p>{item.a}</p></div></details>)}</div>;
}
