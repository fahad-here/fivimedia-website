import { GetServerSideProps } from "next";
import { defaultLocale } from "@/i18n/config";

export default function RootIndex() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: `/${defaultLocale}`,
      permanent: false,
    },
  };
};
