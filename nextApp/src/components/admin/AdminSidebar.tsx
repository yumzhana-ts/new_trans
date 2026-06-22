'use client'
import { usePathname, useRouter } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const link = (path: string) => pathname === path ? 'active' : '';

  return (
    <aside className="admin-sidebar">
      <h6>Admin</h6>
      <a className={link('/admin/users')} onClick={() => router.push('/admin/users')}>
        <i className="bi bi-people" /> Users
      </a>
    </aside>
  );
}
