import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    LayoutDashboard, Package, ShoppingCart, History, CreditCard,
    Wrench, Calculator, TrendingDown, Shield, Settings, LogOut,
    Monitor, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'stock', label: 'Gestion Stock', icon: Package },
    { id: 'sales', label: 'Nouvelle Vente', icon: ShoppingCart },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'credits', label: 'Emprunts / Crédit', icon: CreditCard },
    { id: 'services', label: 'Prestations', icon: Wrench },
    { id: 'accounting', label: 'Comptabilité', icon: Calculator },
    { id: 'expenses', label: 'Dépenses', icon: TrendingDown },
];

const BOTTOM_ITEMS = [
    { id: 'admin', label: 'Administration', icon: Shield, adminOnly: true },
    { id: 'settings', label: 'Paramètres', icon: Settings },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const { theme, currentView, setCurrentView, currentUser, logout, articles } = useApp();

    const lowStockCount = articles.filter(a => a.stock <= a.minStock).length;
    const isAdmin = currentUser?.role === 'admin';

    const NavItem = ({ id, label, icon: Icon, badge }: { id: string; label: string; icon: React.ElementType; badge?: number }) => {
    const active = currentView === id;
    return (
        <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setCurrentView(id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group relative ${
            active
            ? `bg-white/20 ${theme.name.includes('dark') ? '${theme.text}' : '${theme.text}'} shadow-sm`
            : `${theme.name.includes('dark') || theme.name !== 'glass-light' ? 'text-gray-100 hover:text-black hover:bg-black/10' : 'text-black/80 hover:text-black hover:bg-black/15'}`
        }`}
        >
        <div className={`relative flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg ${active ? 'bg-gray/20' : 'group-hover:bg-white/10'} transition`}>
            <Icon className="w-4 h-4" />
            {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
                {badge}
            </span>
            )}
        </div>
        <AnimatePresence>
            {!collapsed && (
            <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm whitespace-nowrap overflow-hidden"
            >
                {label}
            </motion.span>
            )}
        </AnimatePresence>
        {active && (
            <motion.div
            layoutId="active-indicator"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-400 rounded-l-full"
            />
        )}
        </motion.button>
    );
    };

    return (
    <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`relative flex-shrink-0 flex flex-col h-full ${theme.sidebar} z-20`}
    >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/20">
        <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Monitor className="w-5 h-5" />
        </div>
        <AnimatePresence>
            {!collapsed && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
            >
                <p className="text-gray-950 text-md cursor-pointer font-bold leading-tight whitespace-nowrap">GESTION CYBER</p>
                <p className="text-gray-950 text-[10px] font-bold cursor-pointer whitespace-nowrap">Librairie Papeterie Doumbiala</p>
            </motion.div>
            )}
        </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
            <NavItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            badge={item.id === 'stock' ? lowStockCount : undefined}
            />
        ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-black/20 space-y-0.5">
        {BOTTOM_ITEMS.filter(i => !i.adminOnly || isAdmin).map(item => (
            <NavItem key={item.id} id={item.id} label={item.label} icon={item.icon} />
        ))}
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-300/20 transition-all"
        >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg">
            <LogOut className="w-4 h-4" />
            </div>
            <AnimatePresence>
            {!collapsed && (
                <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm whitespace-nowrap overflow-hidden"
                >
                Déconnexion
                </motion.span>
            )}
            </AnimatePresence>
        </motion.button>
        </div>

        {/* Toggle button */}
        <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition z-30"
        >
        {collapsed ? <ChevronRight className="w-3 h-3 text-gray-600" /> : <ChevronLeft className="w-3 h-3 text-gray-600" />}
        </button>
    </motion.aside>
    );
}