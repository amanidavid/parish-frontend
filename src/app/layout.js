import "./globals.css";

export const metadata = {
  title: "PropertyMIS",
  description: "Property Management Information System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
