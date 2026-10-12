import { Routes, Route, Navigate } from 'react-router-dom'
import Shell from './components/Shell'
import { RbacGate } from './components/RbacGate'
import { ThemeEffect } from './components/ThemeEffect'
import Connexion from './pages/Connexion'
import ProductDetail from './pages/ProductDetail'

import AdminDashboard from './pages/admin/Dashboard'
import AdminPrelevements from './pages/admin/Prelevements'
import AdminCommandes from './pages/admin/Commandes'
import AdminSortiesHorsVente from './pages/admin/SortiesHorsVente'
import AdminRapports from './pages/admin/Rapports'
import AdminUtilisateurs from './pages/admin/Utilisateurs'
import AdminAlertes from './pages/admin/Alertes'
import AdminAgentIA from './pages/admin/AgentIA'

import EconomatDashboard from './pages/economat/Dashboard'
import EconomatCatalogue from './pages/economat/Catalogue'
import EconomatStock from './pages/economat/Stock'
import EconomatPrelevements from './pages/economat/Prelevements'
import EconomatCommandes from './pages/economat/Commandes'
import EconomatFournisseurs from './pages/economat/Fournisseurs'
import EconomatMouvements from './pages/economat/Mouvements'

import ServiceDashboard from './pages/service/ServiceDashboard'
import ServiceStock from './pages/service/ServiceStock'
import ServicePrelevements from './pages/service/ServicePrelevements'
import ServiceSortiesHorsVente from './pages/service/ServiceSortiesHorsVente'
import ServiceZMouvements from './pages/service/ServiceZMouvements'

import AdminStockBar from './pages/admin/StockBar'
import AdminStockEconomat from './pages/admin/StockEconomat'
import AdminZMouvements from './pages/admin/ZMouvements'
import AdminStockConfiguration from './pages/admin/StockConfiguration'

export default function App() {
  return (
    <>
      <ThemeEffect />
      <Routes>
      <Route path="/connexion" element={<Connexion />} />
      <Route element={<Shell />}>
        <Route path="/" element={<Navigate to="/connexion" replace />} />
        <Route path="/a-propos" element={<Navigate to="/" replace />} />
        <Route path="/produits/:id" element={<RbacGate allow={['admin', 'economat', 'service', 'bar', 'cuisine']}><ProductDetail /></RbacGate>} />

        <Route path="/admin" element={<RbacGate allow={['admin']}><AdminDashboard /></RbacGate>} />
        <Route path="/admin/stock-bar" element={<RbacGate allow={['admin']}><AdminStockBar /></RbacGate>} />
        <Route path="/admin/z-mouvements" element={<RbacGate allow={['admin']}><AdminZMouvements /></RbacGate>} />
        <Route path="/admin/stock-economat" element={<RbacGate allow={['admin']}><AdminStockEconomat /></RbacGate>} />
        <Route path="/admin/configuration-stock" element={<RbacGate allow={['admin']}><AdminStockConfiguration /></RbacGate>} />
        <Route path="/admin/stocks" element={<Navigate to="/admin/stock-bar" replace />} />
        <Route path="/admin/produits" element={<Navigate to="/admin/stock-economat" replace />} />
        <Route path="/admin/parametres" element={<Navigate to="/admin/configuration-stock" replace />} />
        <Route path="/admin/prelevements" element={<RbacGate allow={['admin']}><AdminPrelevements /></RbacGate>} />
        <Route path="/admin/commandes" element={<RbacGate allow={['admin']}><AdminCommandes /></RbacGate>} />
        <Route path="/admin/receptions" element={<Navigate to="/admin/commandes" replace />} />
        <Route path="/admin/fournisseurs" element={<Navigate to="/admin/commandes" replace />} />
        <Route path="/admin/sorties-hors-vente" element={<RbacGate allow={['admin']}><AdminSortiesHorsVente /></RbacGate>} />
        <Route path="/admin/rapports" element={<RbacGate allow={['admin']}><AdminRapports /></RbacGate>} />
        <Route path="/admin/utilisateurs" element={<RbacGate allow={['admin']}><AdminUtilisateurs /></RbacGate>} />
        <Route path="/admin/alertes" element={<RbacGate allow={['admin']}><AdminAlertes /></RbacGate>} />
        <Route path="/admin/agent-ia" element={<RbacGate allow={['admin']}><AdminAgentIA /></RbacGate>} />

        <Route path="/economat" element={<RbacGate allow={['economat']}><EconomatDashboard /></RbacGate>} />
        <Route path="/economat/produits" element={<RbacGate allow={['economat']}><EconomatCatalogue /></RbacGate>} />
        <Route path="/economat/stock" element={<RbacGate allow={['economat']}><EconomatStock /></RbacGate>} />
        <Route path="/economat/prelevements" element={<RbacGate allow={['economat']}><EconomatPrelevements /></RbacGate>} />
        <Route path="/economat/commandes" element={<RbacGate allow={['economat']}><EconomatCommandes /></RbacGate>} />
        <Route path="/economat/fournisseurs" element={<RbacGate allow={['economat']}><EconomatFournisseurs /></RbacGate>} />
        <Route path="/economat/mouvements" element={<RbacGate allow={['economat']}><EconomatMouvements /></RbacGate>} />

        <Route path="/service" element={<RbacGate allow={['service', 'bar', 'cuisine', 'admin']}><ServiceDashboard /></RbacGate>} />
        <Route path="/service/stock" element={<RbacGate allow={['service', 'bar', 'cuisine', 'admin']}><ServiceStock /></RbacGate>} />
        <Route path="/service/z-mouvements" element={<RbacGate allow={['service', 'bar', 'cuisine', 'admin']}><ServiceZMouvements /></RbacGate>} />
        <Route path="/service/prelevements" element={<RbacGate allow={['service', 'bar', 'cuisine', 'admin']}><ServicePrelevements /></RbacGate>} />
        <Route path="/service/sorties-hors-vente" element={<RbacGate allow={['service', 'bar', 'cuisine', 'admin']}><ServiceSortiesHorsVente /></RbacGate>} />
        <Route path="/service/catalogue" element={<Navigate to="/service/stock" replace />} />
        <Route path="/service/mouvements" element={<Navigate to="/service/z-mouvements" replace />} />

        <Route path="/bar" element={<Navigate to="/service?service=bar" replace />} />
        <Route path="/bar/catalogue" element={<Navigate to="/service/stock?service=bar" replace />} />
        <Route path="/bar/stock" element={<Navigate to="/service/stock?service=bar" replace />} />
        <Route path="/bar/z-mouvements" element={<Navigate to="/service/z-mouvements?service=bar" replace />} />
        <Route path="/bar/prelevements" element={<Navigate to="/service/prelevements?service=bar" replace />} />
        <Route path="/bar/mouvements" element={<Navigate to="/service/z-mouvements?service=bar" replace />} />
        <Route path="/bar/sorties-hors-vente" element={<Navigate to="/service/sorties-hors-vente?service=bar" replace />} />

        <Route path="/cuisine" element={<Navigate to="/service?service=cuisine" replace />} />
        <Route path="/cuisine/catalogue" element={<Navigate to="/service/catalogue?service=cuisine" replace />} />
        <Route path="/cuisine/stock" element={<Navigate to="/service/stock?service=cuisine" replace />} />
        <Route path="/cuisine/prelevements" element={<Navigate to="/service/prelevements?service=cuisine" replace />} />
        <Route path="/cuisine/mouvements" element={<Navigate to="/service/mouvements?service=cuisine" replace />} />
        <Route path="/cuisine/sorties-hors-vente" element={<Navigate to="/service/sorties-hors-vente?service=cuisine" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
    </>
  )
}
