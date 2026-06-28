'use client'
import { usePathname, useRouter } from 'next/navigation';
import AuthHomeNav from '@/components/AuthHomeNav';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const link = (path: string) => pathname === path ? 'active' : '';

  return (
    <aside className="admin-sidebar">
      <AuthHomeNav variant="light" />
      <h6 className="mt-4">Admin</h6>
      <a className={link('/admin/users')} onClick={() => router.push('/admin/users')}>
        <i className="bi bi-people" /> Users
      </a>
    </aside>
  );
}
