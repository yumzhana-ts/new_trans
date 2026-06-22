interface Props {
	roles: string[];
	editingUser: any;
	setEditingUser: any;
	handleSaveEdit: () => void;
	showAddUser: boolean;
	setShowAddUser: any;
	newUserData: any;
	setNewUserData: any;
	handleAddUser: () => void;
  }
  
  export default function UserModals({
	roles,
	editingUser,
	setEditingUser,
	handleSaveEdit,
	showAddUser,
	setShowAddUser,
	newUserData,
	setNewUserData,
	handleAddUser,
  }: Props) {
	return (
	  <>
		{showAddUser && (
		  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
			<div className="admin-card p-4" style={{ width: 400 }}>
			  <h6>Add user</h6>
			  <input className="form-control mb-2" placeholder="Username" value={newUserData.username} onChange={e => setNewUserData({ ...newUserData, username: e.target.value })} />
			  <input className="form-control mb-2" placeholder="Email" value={newUserData.email} onChange={e => setNewUserData({ ...newUserData, email: e.target.value })} />
			  <input type="password" className="form-control mb-2" placeholder="Password" value={newUserData.password} onChange={e => setNewUserData({ ...newUserData, password: e.target.value })} />
			  <div className="text-end">
				<button className="btn btn-light btn-sm me-2" onClick={() => setShowAddUser(false)}>Cancel</button>
				<button className="btn btn-dark btn-sm" onClick={handleAddUser}>Create</button>
			  </div>
			</div>
		  </div>
		)}
  
		{editingUser && (
		  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
			<div className="admin-card p-4" style={{ width: 400 }}>
			  <h6>Edit user</h6>
			  <input className="form-control mb-2" value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} />
			  <input className="form-control mb-2" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
			  <select className="form-select mb-3" value={editingUser.role ?? ''} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
				<option value="" disabled>Select role</option>
				{roles.map(role => (
				  <option key={role} value={role}>
					{role}
				  </option>
				))}
			  </select>
			  <div className="text-end">
				<button className="btn btn-light btn-sm me-2" onClick={() => setEditingUser(null)}>Cancel</button>
				<button className="btn btn-dark btn-sm" onClick={handleSaveEdit}>Save</button>
			  </div>
			</div>
		  </div>
		)}
	  </>
	);
  }
