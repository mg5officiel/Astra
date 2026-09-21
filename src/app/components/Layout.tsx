// Shell principal : interface desktop complète et interface mobile dédiée.
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { IonActionSheet, IonButton, IonContent, IonHeader, IonIcon, IonLabel, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { gridOutline, cartOutline, cubeOutline, swapHorizontalOutline, settingsOutline, ellipsisHorizontalOutline, logOutOutline, chevronBackOutline, chevronForwardOutline, notificationsOutline, shieldCheckmarkOutline, receiptOutline, walletOutline, cashOutline, timeOutline } from 'ionicons/icons';
import { App as CapacitorApp } from '@capacitor/app';
import { useApp } from '../../contexts/AppContext';
import Dashboard from '../pages/Dashboard';
import StockPage from '../pages/StockPage';
import SalesPage from '../pages/SalesPage';
import HistoryPage from '../pages/HistoryPage';
import CreditsPage from '../pages/CreditsPage';
import ServicesPage from '../pages/ServicesPage';
import AccountingPage from '../pages/AccountingPage';
import ExpensesPage from '../pages/ExpensesPage';
import AdminPage from '../pages/AdminPage';
import SettingsPage from '../pages/SettingsPage';

const PAGES: Record<string, ComponentType> = { dashboard: Dashboard, stock: StockPage, sales: SalesPage, history: HistoryPage, credits: CreditsPage, services: ServicesPage, accounting: AccountingPage, expenses: ExpensesPage, admin: AdminPage, settings: SettingsPage };
const DESKTOP_NAV = [['dashboard','Tableau de bord',gridOutline],['sales','Ventes',cartOutline],['stock','Stock',cubeOutline],['credits','Emprunts / Crédit',swapHorizontalOutline],['history','Historique',timeOutline],['services','Prestations',receiptOutline],['accounting','Comptabilité',walletOutline],['expenses','Dépenses',cashOutline]] as const;
const MOBILE_NAV = [['dashboard','Accueil',gridOutline],['sales','Ventes',cartOutline],['stock','Stock',cubeOutline],['credits','Emprunts',swapHorizontalOutline],['settings','Paramètres',settingsOutline]] as const;
const SECONDARY_NAV = [['history','Historique',timeOutline],['services','Prestations',receiptOutline],['accounting','Comptabilité',walletOutline],['expenses','Dépenses',cashOutline]] as const;

export function Layout() {
  const { currentView, setCurrentView, logout, currentUser, theme, articles } = useApp();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const historyRef = useRef<string[]>([]);
  const currentViewRef = useRef(currentView);
  const PageComponent = PAGES[currentView] || Dashboard;
  const lowStock = articles.filter((article) => article.stock <= article.minStock).length;

  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);

  useEffect(() => {
    const listener = CapacitorApp.addListener('backButton', () => {
      const previous = historyRef.current.pop();
      if (previous) setCurrentView(previous);
      else if (currentViewRef.current !== 'dashboard') setCurrentView('dashboard');
      // Sur l'écran d'accueil, le bouton Retour ne force pas la fermeture de l'application.
    });
    return () => { listener.then((handle) => handle.remove()); };
  }, [setCurrentView]);

  const navigate = (view: string) => {
    if (view === currentView) return;
    historyRef.current.push(currentView);
    setCurrentView(view);
    setMoreOpen(false);
  };

  const goBack = () => {
    const previous = historyRef.current.pop();
    if (previous) setCurrentView(previous);
    else setCurrentView('dashboard');
  };

  return (
    <IonPage className={theme.bg}>
      <div className="desktop-shell">
        <aside className={`ionic-sidebar ${desktopCollapsed ? 'collapsed' : ''} ${theme.sidebar}`}>
          <div className="ionic-sidebar-brand"><strong>ASTRA</strong>{!desktopCollapsed && <small>Gestion & Administration</small>}</div>
          <nav className="ionic-sidebar-nav" aria-label="Navigation principale">
            {DESKTOP_NAV.map(([id,label,icon]) => <IonButton key={id} fill={currentView === id ? 'solid' : 'clear'} expand="block" className="sidebar-action" onClick={() => navigate(id)}><IonIcon icon={icon} slot="start" />{!desktopCollapsed && <IonLabel>{label}</IonLabel>}</IonButton>)}
          </nav>
          <div className="sidebar-footer">
            {currentUser?.role === 'admin' && <IonButton fill="clear" expand="block" onClick={() => navigate('admin')}><IonIcon icon={shieldCheckmarkOutline} slot="start" />{!desktopCollapsed && <IonLabel>Administration</IonLabel>}</IonButton>}
            <IonButton fill="clear" expand="block" onClick={() => navigate('settings')}><IonIcon icon={settingsOutline} slot="start" />{!desktopCollapsed && <IonLabel>Paramètres</IonLabel>}</IonButton>
            <IonButton color="danger" fill="clear" expand="block" onClick={logout}><IonIcon icon={logOutOutline} slot="start" />{!desktopCollapsed && <IonLabel>Déconnexion</IonLabel>}</IonButton>
            <IonButton fill="clear" onClick={() => setDesktopCollapsed((value) => !value)} aria-label="Réduire le menu"><IonIcon icon={desktopCollapsed ? chevronForwardOutline : chevronBackOutline} /></IonButton>
          </div>
        </aside>
      </div>

      <IonHeader className="mobile-header">
        <IonToolbar>
          <IonButton fill="clear" onClick={goBack} aria-label="Retour"><IonIcon icon={chevronBackOutline} /></IonButton>
          <IonTitle>ASTRA</IonTitle>
          <IonButton fill="clear" onClick={() => navigate('stock')} aria-label="Alertes stock"><IonIcon icon={notificationsOutline} />{lowStock > 0 && <span className="notification-dot">{lowStock}</span>}</IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent id="main-content" fullscreen className={`page-content ${theme.bg} ${desktopCollapsed ? 'desktop-sidebar-collapsed' : 'desktop-sidebar-expanded'}`}>
        <main className="page-container"><PageComponent /></main>
      </IonContent>

      <nav className="mobile-bottom-nav" aria-label="Navigation mobile principale">
        {MOBILE_NAV.map(([id,label,icon]) => <button key={id} type="button" className={`mobile-nav-item ${currentView === id ? 'active' : ''}`} onClick={() => navigate(id)} aria-label={label} aria-current={currentView === id ? 'page' : undefined}><IonIcon icon={icon} />{id === 'stock' && lowStock > 0 && <span className="mobile-stock-badge">{lowStock}</span>}</button>)}
        <button type="button" className={`mobile-nav-item ${moreOpen ? 'active' : ''}`} onClick={() => setMoreOpen(true)} aria-label="Plus"><IonIcon icon={ellipsisHorizontalOutline} /></button>
      </nav>

      <IonActionSheet isOpen={moreOpen} onDidDismiss={() => setMoreOpen(false)} header="ASTRA" buttons={[
        ...SECONDARY_NAV.map(([id,label,icon]) => ({ text: label, icon, handler: () => navigate(id) })),
        ...(currentUser?.role === 'admin' ? [{ text: 'Administration', icon: shieldCheckmarkOutline, handler: () => navigate('admin') }] : []),
        { text: 'Déconnexion', role: 'destructive' as const, icon: logOutOutline, handler: logout },
        { text: 'Annuler', role: 'cancel' as const },
      ]} />
    </IonPage>
  );
}
