export const metadata = { title: "Stellar DevKit", description: "SDKs and tools for Stellar DeFi" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0a0a0a", color: "#e4e4e7" }}>
        {children}
      </body>
    </html>
  );
}
