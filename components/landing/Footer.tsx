import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="bg-[#0a1628] pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <Link href="/" className="inline-block mb-4">
              <img src="/logo_dark.webp" alt="TaxCompPro" className="h-12 w-auto" />
            </Link>
            <p className="text-white/45 text-sm leading-relaxed">The professional community for tax experts across America.</p>
          </div>
          {[
            { title: "Platform",  links: [["Marketplace","/marketplace"],["Communities","/communities"],["Pricing & Plans","/upgrade"],["Upgrade Membership","/upgrade"],["Dashboard","/dashboard"]] },
            { title: "Company",   links: [["About Us","/about"],["Contact","/contact"],["Become an Affiliate","https://affiliate.taxcomppro.com"],["Security","/security"]] },
            { title: "Legal",     links: [["Terms of Service","/terms"],["Privacy Policy","/privacy"],["Community Guidelines","/community-guidelines"],["Cookie Policy","/cookie-policy"]] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-bold text-sm mb-4">{col.title}</h4>
              {col.links.map(([label, href]) => (
                href.startsWith("http") ? (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="block text-white/45 text-sm mb-2.5 hover:text-[#f0c040] transition-colors">{label}</a>
                ) : (
                  <Link key={label} href={href} className="block text-white/45 text-sm mb-2.5 hover:text-[#f0c040] transition-colors">{label}</Link>
                )
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-white/30 text-xs">
          <p>© {new Date().getFullYear()} TaxCompPro. All rights reserved.</p>
          <p>Built for tax professionals</p>
        </div>
      </div>
    </footer>
  );
}
