export default function UsersTable({ users, onEdit, onDelete }: any) {
  return (
    <div className="table-responsive">
      <table className="table mb-0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Groups</th>
            <th>Challenges</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((user: any) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>-</td>
              <td>-</td>
              <td>{new Date(user.created_at).toLocaleString()}</td>
              <td className="text-end">
                <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => onEdit(user)}>
                  <i className="bi bi-pencil" />
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(user.id)}>
                  <i className="bi bi-trash" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}