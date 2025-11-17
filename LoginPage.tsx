import React, { useState } from 'react';

interface LoginPageProps {
    onLogin: (user: string, pass: string) => void;
    error: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <span className="text-6xl">❄️</span>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-4">JN Refrigeração</h1>
                    <p className="text-slate-400 mt-2">Dashboard de Manutenção</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-semibold text-center text-white mb-6">Login</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-2">Usuário</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-500 focus:border-cyan-500 transition"
                                placeholder="JN ou apolinario"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-2">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white focus:ring-cyan-500 focus:border-cyan-500 transition"
                                placeholder="Digite sua senha"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-md">{error}</p>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transition-colors"
                            >
                                Entrar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;