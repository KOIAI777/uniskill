import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Submit Skill" },
  { href: "mailto:1146850129@qq.com", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="w-full py-12 mt-auto bg-surface-container-low">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-8 gap-4">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-bold text-lg">UniSkill</span>
          <p className="text-on-surface-variant text-sm mt-1">
            &copy; {new Date().getFullYear()} UniSkill. Digital Scholar Workshop.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-sm leading-relaxed">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-on-surface-variant hover:text-primary hover:underline transition-all opacity-80 hover:opacity-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
