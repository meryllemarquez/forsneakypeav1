import { useEffect, useState } from 'react'; // Fixed: Removed unused 'React' import
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('fsp_token') || localStorage.getItem('token');
        const res = await axios.get('http://localhost:8080/api/v1/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.data || res.data || []);
      } catch (err) {
        console.error('Failed to load users', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <h2>👑 System Administration Panel</h2>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </header>

      {loading ? (
        <p>Loading system accounts...</p>
      ) : (
        <div className={styles.tableCard}>
          <h3>Registered User Accounts</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name || u.displayName}</td>
                  <td>{u.username}</td>
                  <td><span className={styles.roleTag}>{u.role}</span></td>
                  <td>
                    <span className={styles.statusTag}>
                      {u.active !== false ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}