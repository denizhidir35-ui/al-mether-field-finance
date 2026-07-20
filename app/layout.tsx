import "./globals.css";

const themeScript = `
  (() => {
    try {
      const stored = localStorage.getItem("al-mether-theme");
      const preference = stored === "dark" || stored === "system" ? stored : "light";
      const theme = preference === "system"
        ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : preference;
      document.documentElement.dataset.themePreference = preference;
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.dataset.themePreference = "light";
      document.documentElement.dataset.theme = "light";
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

export const metadata = {
  title: "AL Mether Platform",
  description: "CEO Flow Finance Platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme="light" data-theme-preference="light" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
