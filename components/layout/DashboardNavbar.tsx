'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sparkles, Users, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function DashboardNavbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <header className="glass sticky top-0 z-50 animate-slide-up">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-12">
            {/* Logo */}
            <Link href="/dashboard" className="group">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300" style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)' }}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: 'var(--color-accent-500)' }} />
                </div>
                <div>
                  <h1 className="font-display text-xl font-semibold leading-tight" style={{ color: 'var(--color-primary-700)' }}>
                    NutriCoach Pro
                  </h1>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>智能营养分析</p>
                </div>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard" icon={<Sparkles className="w-4 h-4" />}>
                控制台
              </NavLink>
              <NavLink href="/clients" icon={<Users className="w-4 h-4" />}>
                客户管理
              </NavLink>
              <NavLink href="/settings" icon={<Settings className="w-4 h-4" />}>
                设置
              </NavLink>
            </nav>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/60 hover:bg-white/80 border transition-all duration-300 group"
                style={{ borderColor: 'var(--color-primary-100)' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary-200)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-primary-100)'}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-display font-semibold text-sm shadow-md" style={{ background: 'linear-gradient(135deg, var(--color-accent-400) 0%, var(--color-accent-600) 100%)' }}>
                  {session?.user?.name?.[0] || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {session?.user?.name || '用户'}
                  </div>
                  <div className="text-xs truncate max-w-[150px]" style={{ color: 'var(--color-text-muted)' }}>
                    {session?.user?.email}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-text-muted)' }} />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 animate-scale-in origin-top-right" style={{ border: '1px solid var(--color-primary-100)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-primary-100)' }}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {session?.user?.name || '用户'}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {session?.user?.email}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-50)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut className="w-4 h-4" />
                    登出
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Navigation Link Component
function NavLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group"
      style={{ color: 'var(--color-text-secondary)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--color-primary-700)';
        e.currentTarget.style.backgroundColor = 'rgba(61, 90, 78, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--color-text-secondary)';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span className="flex items-center gap-2">
        <span className="transition-colors" style={{ color: 'var(--color-primary-400)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent-500)'}>
          {icon}
        </span>
        {children}
      </span>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full transition-all duration-300" style={{ backgroundColor: 'var(--color-accent-500)' }} onMouseEnter={(e) => e.currentTarget.style.width = '50%'} />
    </Link>
  );
}
