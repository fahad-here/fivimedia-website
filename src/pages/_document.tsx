import { Html, Head, Main, NextScript, DocumentProps } from "next/document";

export default function Document(props: DocumentProps) {
  // Get locale from the URL path
  const locale = props.__NEXT_DATA__.query.locale as string || "en";
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <Html lang={locale} dir={direction}>
      <Head />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
