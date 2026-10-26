import type { Metadata } from 'next';
import './globals.css';
import { ZeroLeakProvider } from '@/context/ZeroLeakContext';
import { ZeroLeakSidebar } from '@/components/zeroleak/ZeroLeakSidebar';
import { ToastContainer } from '@/components/zeroleak/ToastContainer';
import { RedactionInspectorModal } from '@/components/zeroleak/RedactionInspectorModal';
import { RegexSandboxModal } from '@/components/zeroleak/RegexSandboxModal';
import { AuditLogModal } from '@/components/zeroleak/AuditLogModal';

export const metadata: Metadata = {
  title: 'ZeroLeak AI — VibeProofLens AI Security',
  description:
    'Real-time privacy firewall, secret detection, and data-loss prevention (DLP) for AI interactions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased bg-slate-100">
      <body className="h-full flex flex-col font-sans bg-slate-100 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <ZeroLeakProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Left Sidebar */}
            <ZeroLeakSidebar />

            {/* Main Application Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8FAFC]">
              {children}
            </div>
          </div>

          {/* Interactive Modals & Toasts */}
          <RedactionInspectorModal />
          <RegexSandboxModal />
          <AuditLogModal />
          <ToastContainer />
        </ZeroLeakProvider>
      </body>
    </html>
  );
}
