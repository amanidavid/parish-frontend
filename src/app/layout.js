import "./globals.css";
import QueryProvider from '@/components/providers/QueryProvider';

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "PMS",
  description: "Property Management Information System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
