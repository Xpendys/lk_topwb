import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';

export default function CabinetPage({ onLogout }) {
  const [tab, setTab] = useState('main');
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState([]);
  const [marketFilter, setMarketFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await apiRequest('/api/user/me');
        setProfile(me);
        const rows = await apiRequest('/api/stats/buyouts');
        setStats(rows.rows || []);
      } catch (err) {
        setError(err.message);
      }
    };

    loadData();
  }, []);

  const filteredStats = useMemo(() => {
    if (marketFilter === 'all') return stats;
    return stats.filter((row) => String(row.marketplace || '').toLowerCase() === marketFilter);
  }, [stats, marketFilter]);

  const logout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    onLogout();
  };

  if (error) {
    return <div className="card error">{error}</div>;
  }

  if (!profile) {
    return <div className="card">Загрузка...</div>;
  }

  return (
    <div className="card wide">
      <h1>Личный кабинет</h1>
      <div className="tabs">
        <button className={tab === 'main' ? 'active' : ''} onClick={() => setTab('main')}>Главная</button>
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>Статистика выкупов</button>
      </div>

      {tab === 'main' && (
        <div className="grid">
          <p><b>Идентификатор:</b> {profile.email}</p>
          <p><b>Телефон:</b> {profile.phone}</p>
          <p><b>Email:</b> {profile.email}</p>
          <p><b>Направления:</b> {profile.selectedMarketplaces.join(', ')}</p>
          <p><b>Дата регистрации:</b> {new Date(profile.createdAt).toLocaleString('ru-RU')}</p>
          <button onClick={logout}>Выйти</button>
        </div>
      )}

      {tab === 'stats' && (
        <div>
          <div className="filter-row">
            <label>Фильтр маркетплейса</label>
            <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="wb">Wildberries</option>
              <option value="ozon">Ozon</option>
            </select>
          </div>

          {!filteredStats.length ? (
            <p>Пока нет данных по выкупам.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>{Object.keys(filteredStats[0]).map((key) => <th key={key}>{key}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredStats.map((row, idx) => (
                    <tr key={idx}>{Object.keys(row).map((key) => <td key={key}>{row[key]}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
