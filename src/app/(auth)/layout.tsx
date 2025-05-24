// src/app/(auth)/layout.tsx (Opsiyonel, auth sayfaları için ortak bir layout)
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-prestij-bg-dark-2 p-4">
      {/* Belki bir logo veya başlık eklenebilir */}
      {children}
    </div>
  );
}