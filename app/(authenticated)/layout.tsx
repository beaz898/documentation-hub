import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
