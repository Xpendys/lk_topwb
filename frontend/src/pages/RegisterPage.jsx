import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';

export default function RegisterPage({ onAuth }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    phone: '',
    email: '',
    password: '',
    passwordConfirm: '',
    selectedMarketplaces: [],
  });

  const setMarketplace = (value) => {
    setForm((prev) => ({
      ...prev,
      selectedMarketplaces: prev.selectedMarketplaces.includes(value)
        ? prev.selectedMarketplaces.filter((item) => item !== value)
        : [...prev.selectedMarketplaces, value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onAuth(true);
      navigate('/cabinet');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card">
      <h1>Регистрация</h1>
      <form onSubmit={handleSubmit} className="form">
        <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Пароль" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input
          placeholder="Подтверждение пароля"
          type="password"
          value={form.passwordConfirm}
          onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
        />

        <div className="checkboxes">
          <label>
            <input type="checkbox" checked={form.selectedMarketplaces.includes('wb')} onChange={() => setMarketplace('wb')} />
            Wildberries
          </label>
          <label>
            <input type="checkbox" checked={form.selectedMarketplaces.includes('ozon')} onChange={() => setMarketplace('ozon')} />
            Ozon
          </label>
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit">Создать аккаунт</button>
      </form>
      <p>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}
