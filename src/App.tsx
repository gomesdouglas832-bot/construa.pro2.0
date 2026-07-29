import { useEffect } from 'react';
import { useRouter } from './lib/router';
import { useAuth } from './lib/AuthContext';
import { AuthProvider } from './lib/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { FullPageSpinner } from './components/ui/Spinner';
import { PublicHeader } from './components/PublicHeader';
import { PublicFooter } from './components/PublicFooter';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { ProfessionalPage } from './pages/ProfessionalPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { DashboardProfilePage } from './pages/DashboardProfilePage';
import { DashboardPortfolioPage } from './pages/DashboardPortfolioPage';
import { DashboardStoriesPage } from './pages/DashboardStoriesPage';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { UpdatePassword } from './components/auth/UpdatePassword';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { PrivacyConsentModal } from './components/PrivacyConsentModal';
import { AdminAdsPage } from './pages/AdminAdspage';
import { AdminBannedPage } from './pages/AdminBannedPage';

function Routes() {
  const { route, navigate } = useRouter();
  const { user, profile, loading } = useAuth();

  // Redirect auth-aware routes
  useEffect(() => {
    if (loading) return;

    // PROTEÇÃO CRÍTICA: Se o usuário estiver no fluxo de reset de senha, 
    // não redirecionar, independente do estado de autenticação.
    if (route.name === 'reset-password') return;

    const dashRoutes = ['dashboard', 'dashboard-profile', 'dashboard-portfolio', 'dashboard-stories'];
    const adminRoutes = ['admin-ads', 'admin-banned'];

    // Redirecionar para signin se tentar acessar dashboard sem estar logado
    if (dashRoutes.includes(route.name) && !user) {
      navigate('/signin');
    }

    // Rotas admin: precisa estar logado E ter is_admin = true.
    // Se nao for admin, manda pra home discretamente (nao revela
    // que a rota existe nem por que foi bloqueado).
    if (adminRoutes.includes(route.name)) {
      if (!user) {
        navigate('/signin');
      } else if (profile && !profile.is_admin) {
        navigate('/');
      }
    }
    
    // Redirecionar para dashboard se já estiver logado e tentar acessar login/signup
    if ((route.name === 'signin' || route.name === 'signup') && user) {
      navigate('/dashboard');
    }
  }, [route, user, profile, loading, navigate]);

  if (loading) {
    return <FullPageSpinner />;
  }

  switch (route.name) {
    case 'home':
      return (
        <>
          <PublicHeader onNavigate={navigate} />
          <HomePage onNavigate={navigate} />
          <PublicFooter onNavigate={navigate} />
        </>
      );
    case 'browse':
      return (
        <>
          <PublicHeader onNavigate={navigate} onSearch={(q) => navigate(`/explore?q=${encodeURIComponent(q)}`)} searchValue={route.q} />
          <BrowsePage onNavigate={navigate} initialCategory={route.category} initialQuery={route.q} />
          <PublicFooter onNavigate={navigate} />
        </>
      );
    case 'professional':
      return (
        <>
          <PublicHeader onNavigate={navigate} />
          <ProfessionalPage id={route.id} onNavigate={navigate} />
        </>
      );
    case 'signin':
      return <AuthPage mode="signin" onNavigate={navigate} />;
    case 'signup':
      return <AuthPage mode="signup" onNavigate={navigate} />;
    
    // Rotas de recuperação de senha
    case 'forgot-password':
      return <ForgotPassword onNavigate={navigate} />;
    case 'reset-password':
      return <UpdatePassword onNavigate={navigate} />;

    // Política de Privacidade (LGPD)
    case 'privacy-policy':
      return (
        <>
          <PublicHeader onNavigate={navigate} />
          <PrivacyPolicyPage onNavigate={navigate} />
          <PublicFooter onNavigate={navigate} />
        </>
      );

    // Termos de Uso e Responsabilidade
    case 'terms-of-service':
      return (
        <>
          <PublicHeader onNavigate={navigate} />
          <TermsOfServicePage onNavigate={navigate} />
          <PublicFooter onNavigate={navigate} />
        </>
      );

    case 'dashboard':
      return <DashboardPage onNavigate={navigate} />;
    case 'dashboard-profile':
      return <DashboardProfilePage onNavigate={navigate} />;
    case 'dashboard-portfolio':
      return <DashboardPortfolioPage onNavigate={navigate} />;
    case 'dashboard-stories':
      return <DashboardStoriesPage onNavigate={navigate} />;

    // Painel Admin
    case 'admin-ads':
      return <AdminAdsPage onNavigate={navigate} />;
    case 'admin-banned':
      return <AdminBannedPage onNavigate={navigate} />;

    default:
      return (
        <>
          <PublicHeader onNavigate={navigate} />
          <HomePage onNavigate={navigate} />
          <PublicFooter onNavigate={navigate} />
        </>
      );
  }
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        {/* Modal de consentimento LGPD: fica sempre montado, aparece
            por cima de qualquer rota na primeira visita do usuario */}
        <AppWithConsent />
      </ToastProvider>
    </AuthProvider>
  );
}

function AppWithConsent() {
  const { navigate } = useRouter();
  return (
    <>
      <PrivacyConsentModal onNavigate={navigate} />
      <Routes />
    </>
  );
}

export default App;