import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useSyncExternalStore, useState, useRef, useEffect } from "react";
import Button from "./ui/Button";
import { locales, type Locale } from "@/i18n/config";

// Hydration-safe mounted check
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

const languageNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

const Header = () => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  const locale = (router.query.locale as Locale) || "en";
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/llc-formation`, label: t("llcFormation") },
    { href: `/${locale}/pricing`, label: t("pricing") },
    { href: `/${locale}/faqs`, label: t("faqs") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  const changeLocale = (newLocale: Locale) => {
    const currentPath = router.asPath;
    const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
    setLangDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <span className="text-xl font-bold text-[var(--color-primary)]">FiviMedia</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Language Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] font-medium px-2 py-1 rounded-lg hover:bg-[var(--background-muted)] transition-colors"
                aria-label="Select language"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <span>{languageNames[locale]}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg py-1 z-50">
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => changeLocale(loc)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--background-muted)] transition-colors ${
                        locale === loc ? "text-[var(--color-primary)] font-medium" : "text-[var(--foreground)]"
                      }`}
                    >
                      {languageNames[loc]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-[var(--background-muted)] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                  </svg>
                )}
              </button>
            )}

            {/* CTA Button */}
            <Link href={`/${locale}/start`}>
              <Button size="sm">{tCommon("startNow")}</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-[var(--background-muted)]" aria-label="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
