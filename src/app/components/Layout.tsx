// Shell principal Ionic : menu mobile, navigation desktop et zone de contenu.
import { useState, type ComponentType } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  menuOutline,
  logOutOutline,
  chevronBackOutline,
  chevronForwardOutline,
  notificationsOutline,
  settingsOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
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

const PAGES: Record<string, ComponentType> = {
  dashboard: Dashboard,
  stock: StockPage,
  sales: SalesPage,
  history: HistoryPage,
  credits: CreditsPage,
  services: ServicesPage,
  accounting: AccountingPage,
  expenses: ExpensesPage,
  admin: AdminPage,
  settings: SettingsPage,
};

const NAV_ITEMS = [
  ['dashboard', 'Tableau de bord'],
  ['stock', 'Gestion Stock'],
  ['sales', 'Nouvelle Vente'],
  ['history', 'Historique'],
  ['credits', 'Emprunts / Crédit'],
  ['services', 'Prestations'],
  ['accounting', 'Comptabilité'],
  ['expenses', 'Dépenses'],
] as const;

export function Layout() {
  const { currentView, setCurrentView, logout, currentUser, theme, articles } = useApp();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const PageComponent = PAGES[currentView] || Dashboard;
  const lowStock = articles.filter((article) => article.stock <= article.minStock).length;

  const navigate = (view: string) => setCurrentView(view);

  return (
    <IonPage className={theme.bg}>
      <IonMenu contentId="main-content" type="overlay" className="mobile-app-menu">
        <IonHeader>
          <IonToolbar>
            <IonTitle>GESTION CYBER</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList lines="none">
            {NAV_ITEMS.map(([id, label]) => (
              <IonMenuToggle key={id} autoHide={false}>
                <IonItem
                  button
                  detail={false}
                  color={currentView === id ? 'light' : undefined}
                  onClick={() => navigate(id)}
                >
                  <IonLabel>{label}</IonLabel>
                  {id === 'stock' && lowStock > 0 && <span className="ion-badge">{lowStock}</span>}
                </IonItem>
              </IonMenuToggle>
            ))}

            {currentUser?.role === 'admin' && (
              <IonMenuToggle autoHide={false}>
                <IonItem button detail={false} onClick={() => navigate('admin')}>
                  <IonIcon icon={shieldCheckmarkOutline} slot="start" />
                  <IonLabel>Administration</IonLabel>
                </IonItem>
              </IonMenuToggle>
            )}

            <IonMenuToggle autoHide={false}>
              <IonItem button detail={false} onClick={() => navigate('settings')}>
                <IonIcon icon={settingsOutline} slot="start" />
                <IonLabel>Paramètres</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonItem button detail={false} color="danger" onClick={logout}>
              <IonIcon icon={logOutOutline} slot="start" />
              <IonLabel>Déconnexion</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

      <div className="desktop-shell">
        <aside className={`ionic-sidebar ${desktopCollapsed ? 'collapsed' : ''} ${theme.sidebar}`}>
          <div className="ionic-sidebar-brand">
            <strong>GESTION CYBER</strong>
            {!desktopCollapsed && <small>Librairie Papeterie Doumbiala</small>}
          </div>

          <nav className="ionic-sidebar-nav" aria-label="Navigation principale">
            {NAV_ITEMS.map(([id, label]) => (
              <IonButton
                key={id}
                fill={currentView === id ? 'solid' : 'clear'}
                expand="block"
                className="sidebar-action"
                onClick={() => navigate(id)}
              >
                <IonLabel>{desktopCollapsed ? label.charAt(0) : label}</IonLabel>
              </IonButton>
            ))}
          </nav>

          <div className="sidebar-footer">
            {currentUser?.role === 'admin' && (
              <IonButton fill="clear" expand="block" onClick={() => navigate('admin')}>
                <IonLabel>{desktopCollapsed ? 'A' : 'Administration'}</IonLabel>
              </IonButton>
            )}
            <IonButton fill="clear" expand="block" onClick={() => navigate('settings')}>
              <IonLabel>{desktopCollapsed ? 'P' : 'Paramètres'}</IonLabel>
            </IonButton>
            <IonButton color="danger" fill="clear" expand="block" onClick={logout}>
              <IonLabel>{desktopCollapsed ? 'D' : 'Déconnexion'}</IonLabel>
            </IonButton>
            <IonButton
              fill="clear"
              onClick={() => setDesktopCollapsed((value) => !value)}
              aria-label={desktopCollapsed ? 'Développer le menu' : 'Réduire le menu'}
            >
              <IonIcon icon={desktopCollapsed ? chevronForwardOutline : chevronBackOutline} />
            </IonButton>
          </div>
        </aside>
      </div>

      <IonHeader className="mobile-header">
        <IonToolbar>
          <IonMenuToggle>
            <IonButton fill="clear" aria-label="Ouvrir le menu">
              <IonIcon icon={menuOutline} />
            </IonButton>
          </IonMenuToggle>
          <IonTitle>GestCy</IonTitle>
          <IonButton fill="clear" onClick={() => navigate('stock')} aria-label="Alertes stock">
            <IonIcon icon={notificationsOutline} />
            {lowStock > 0 && <span className="notification-dot">{lowStock}</span>}
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent id="main-content" fullscreen className={`page-content ${theme.bg} ${desktopCollapsed ? "desktop-sidebar-collapsed" : "desktop-sidebar-expanded"}`}>
        <main className="page-container">
          <PageComponent />
        </main>
      </IonContent>
    </IonPage>
  );
}
