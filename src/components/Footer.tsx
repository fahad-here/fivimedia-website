import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { type Locale } from "@/i18n/config";

const Footer = () => {
  const router = useRouter();
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();
  const locale = (router.query.locale as Locale) || "en";

  return (
    <footer className="bg-[var(--background-muted)] border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-lg font-bold text-[var(--color-primary)]">FiviMedia</span>
            <p className="text-sm text-[var(--foreground-muted)]">
              &copy; {currentYear} FiviMedia. {t("allRightsReserved")}
            </p>
          </div>

          {/* Legal Links */}
          <nav className="flex items-center gap-6">
            <Link
              href={`/${locale}/terms`}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {t("terms")}
            </Link>
            <Link
              href={`/${locale}/privacy`}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {t("privacy")}
            </Link>
          </nav>

          {/* Contact */}
          <div className="text-center md:text-end">
            <a
              href="mailto:support@fivimedia.com"
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              support@fivimedia.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
