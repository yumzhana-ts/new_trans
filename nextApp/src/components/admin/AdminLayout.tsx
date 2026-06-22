import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';

interface Props {
  title: string;
  children: ReactNode;
}

export default function AdminLayout({ title, children }: Props) {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-header">
          <h6>{title}</h6>
        </div>

        {children}
      </main>
    </div>
  );
}
