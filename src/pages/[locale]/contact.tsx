import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { GetStaticProps, GetStaticPaths } from "next";
import Layout from "@/components/Layout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { locales } from "@/i18n/config";

export default function Contact() {
  const t = useTranslations("contact");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("nameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("emailInvalid");
    }

    if (!formData.message.trim()) {
      newErrors.message = t("messageRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="py-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-[var(--foreground-muted)]">
              {t("subtitle")}
            </p>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t("nameLabel")}
              name="name"
              placeholder={t("namePlaceholder")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              disabled={isSubmitting}
            />

            <Input
              label={t("emailLabel")}
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              disabled={isSubmitting}
            />

            <Textarea
              label={t("messageLabel")}
              name="message"
              placeholder={t("messagePlaceholder")}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              error={errors.message}
              disabled={isSubmitting}
              rows={5}
            />

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              {t("submitButton")}
            </Button>

            {/* Success Message */}
            {submitStatus === "success" && (
              <div className="p-4 bg-[var(--color-success)]/10 border border-[var(--color-success)] rounded-lg">
                <p className="text-[var(--color-success)] text-center">
                  {t("successMessage")}
                </p>
              </div>
            )}

            {/* Error Message */}
            {submitStatus === "error" && (
              <div className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)] rounded-lg">
                <p className="text-[var(--color-error)] text-center">
                  {t("errorMessage")}
                </p>
              </div>
            )}
          </form>

          {/* Alternative Contact */}
          <div className="mt-12 text-center">
            <p className="text-[var(--foreground-muted)]">
              {t("alternativeContact")}{" "}
              <a
                href="mailto:support@fivimedia.com"
                className="text-[var(--color-primary)] hover:underline"
              >
                support@fivimedia.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: locales.map((locale) => ({ params: { locale } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const locale = params?.locale as string;

  return {
    props: {
      locale,
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
};
