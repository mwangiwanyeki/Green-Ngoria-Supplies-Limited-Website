import { siteConfig } from '@/config/site';

/**
 * FAQPage structured data for Google Search rich snippets.
 * Emphasizes Gold Mining, CIP/CIL Gold Processing Plants, and Mining Equipment Installation.
 */
export function GoldPlantFaqJsonLd() {
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What core gold mining and processing services does Green Ngoria Supplies Limited provide?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Green Ngoria Supplies Limited provides end-to-end gold mining services, turnkey engineering, procurement, and construction (EPC) of gold mineral processing plants (including Carbon-in-Pulp and Carbon-in-Leach systems), heavy mining equipment supply and installation, and plant optimization diagnostics across Kenya, Tanzania, and East Africa.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Green Ngoria engineer and build turnkey CIP and CIL gold processing plants?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Green Ngoria engineers, fabricates, constructs, and commissions complete Carbon-in-Pulp (CIP) and Carbon-in-Leach (CIL) gold processing plants. Scope includes primary/secondary crushing, ball mill grinding circuits, hydrocyclone classification, leach agitation tank farms, carbon elution columns, electrowinning cells, and gold smelting bullion houses.',
        },
      },
      {
        '@type': 'Question',
        name: 'What mining machinery and equipment does Green Ngoria supply and install?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Green Ngoria supplies and installs certified mining machinery including primary jaw crushers, cone crushers, ball mills, vibrating screens, Knelson centrifugal gravity concentrators, interstage carbon screens, slurry slurry pumps, desorption elution systems, and gold smelting induction furnaces with full mechanical alignment and electrical automation.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where are Green Ngoria’s gold mining and processing operations located?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Green Ngoria operates active gold mining concessions at Bondo in Siaya County and at Taita Taveta in Kenya, alongside established mining interests in Tanzania. The company also operates a NEMA-approved small-scale gold processing plant (Ref: NEMA/PR/SYA/002) at Bondo, Siaya County.',
        },
      },
      {
        '@type': 'Question',
        name: 'How can mine owners request a technical plant assessment or equipment quotation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mine owners, investors, and operators can submit a Technical Plant Assessment request or RFQ directly via the Green Ngoria digital platform at https://www.greenngoria.com/technical-assessment or by contacting Customer Care at +254 704 160 431.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
    />
  );
}
