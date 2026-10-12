import { Routes, Route, Navigate } from 'react-router-dom'
import Shell from './components/Shell'
import { RbacGate } from './components/RbacGate'
import { ThemeEffect } from './components/ThemeEffect'
import Connexion from './pages/Connexion'
import About from './pages/About'
import ProductDetail from './pages/ProductDetail'

import AdminDashboard from './pages/admin/Dashboard'
import AdminProduits from './pages/admin/Produits'
import AdminStocks from './pages/admin/Stocks'
import AdminPrelevements from './pages/admin/Prelevements'
import AdminCommandes from './pages/admin/Commandes'
import AdminReceptions from './pages/admin/Receptions'
import AdminSortiesHorsVente from './pages/admin/SortiesHorsVente'
import AdminRapports from './pages/admin/Rapports'
import AdminUtilisateurs from './pages/admin/Utilisateurs'
import AdminParametres from './pages/admin/Parametres'
import AdminAlertes from './pages/admin/Alertes'
import AdminFournisseurs from './pages/admin/Fournisseurs'
import AdminAgentIA from './pages/admin/AgentIA'

import EconomatDashboard from './pages/economat/Dashboard'
import EconomatCatalogue from './pages/economat/Catalogue'
import EconomatStock from './pages/economat/Stock'
import EconomatPrelevements from './pages/economat/Prelevements'
import EconomatCommandes from './pages/economat/Commandes'
import EconomatFournisseurs from './pages/economat/Fournisseurs'
import EconomatMouvements from './pages/economat/Mouvements'

import BarDashboard from './pages/bar/Dashboard'
import BarCatalogue from './pages/bar/Catalogue'
import BarStock from './pages/bar/Stock'
import BarPrelevements from './pages/bar/Prelevements'
import BarMouvements from './pages/bar/Mouvements'
import BarSortiesHorsVente from './pages/bar/SortiesHorsVente'

import CuisineDashboard from './pages/cuisine/Dashboard'
import CuisineCatalogue from './pages/cuisine/Catalogue'
import CuisineStock from './pages/cuisine/Stock'
import CuisinePrelevements from './pages/cuisine/Prelevements'
import CuisineMouvements from './pages/cuisine/Mouvements'
import CuisineSortiesHorsVente from './pages/cuisine/SortiesHorsVente'

export default function App() {
  return (
    <>
      <ThemeEffect />
      <Routes>
      <Route path="/connexion" element={<Connexion />} />
      <Route element={<Shell />}>
        <Route path="/" element={<Navigate to="/connexion" replace />} />
        <Route path="/a-propos" element={<RbacGate allow={['admin', 'economat', 'bar', 'cuisine']}><About /></RbacGate>} />
        <Route path="/produits/:id" element={<RbacGate allow={['admin', 'economat', 'bar', 'cuisine']}><ProductDetail /></RbacGate>} />

        <Route path="/admin" element={<RbacGate allow={['admin']}><AdminDashboard /></RbacGate>} />
        <Route path="/admin/produits" element={<RbacGate allow={['admin']}><AdminProduits /></RbacGate>} />
        <Route path="/admin/stocks" element={<RbacGate allow={['admin']}><AdminStocks /></RbacGate>} />
        <Route path="/admin/prelevements" element={<RbacGate allow={['admin']}><AdminPrelevements /></RbacGate>} />
        <Route path="/admin/commandes" element={<RbacGate allow={['admin']}><AdminCommandes /></RbacGate>} />
        <Route path="/admin/receptions" element={<RbacGate allow={['admin']}><AdminReceptions /></RbacGate>} />
        <Route path="/admin/sorties-hors-vente" element={<RbacGate allow={['admin']}><AdminSortiesHorsVente /></RbacGate>} />
        <Route path="/admin/rapports" element={<RbacGate allow={['admin']}><AdminRapports /></RbacGate>} />
        <Route path="/admin/utilisateurs" element={<RbacGate allow={['admin']}><AdminUtilisateurs /></RbacGate>} />
        <Route path="/admin/parametres" element={<RbacGate allow={['admin']}><AdminParametres /></RbacGate>} />
        <Route path="/admin/alertes" element={<RbacGate allow={['admin']}><AdminAlertes /></RbacGate>} />
        <Route path="/admin/fournisseurs" element={<RbacGate allow={['admin']}><AdminFournisseurs /></RbacGate>} />
        <Route path="/admin/agent-ia" element={<RbacGate allow={['admin']}><AdminAgentIA /></RbacGate>} />

        <Route path="/economat" element={<RbacGate allow={['economat']}><EconomatDashboard /></RbacGate>} />
        <Route path="/economat/produits" element={<RbacGate allow={['economat']}><EconomatCatalogue /></RbacGate>} />
        <Route path="/economat/stock" element={<RbacGate allow={['economat']}><EconomatStock /></RbacGate>} />
        <Route path="/economat/prelevements" element={<RbacGate allow={['economat']}><EconomatPrelevements /></RbacGate>} />
        <Route path="/economat/commandes" element={<RbacGate allow={['economat']}><EconomatCommandes /></RbacGate>} />
        <Route path="/economat/fournisseurs" element={<RbacGate allow={['economat']}><EconomatFournisseurs /></RbacGate>} />
        <Route path="/economat/mouvements" element={<RbacGate allow={['economat']}><EconomatMouvements /></RbacGate>} />

        <Route path="/bar" element={<RbacGate allow={['bar']}><BarDashboard /></RbacGate>} />
        <Route path="/bar/catalogue" element={<RbacGate allow={['bar']}><BarCatalogue /></RbacGate>} />
        <Route path="/bar/stock" element={<RbacGate allow={['bar']}><BarStock /></RbacGate>} />
        <Route path="/bar/prelevements" element={<RbacGate allow={['bar']}><BarPrelevements /></RbacGate>} />
        <Route path="/bar/mouvements" element={<RbacGate allow={['bar']}><BarMouvements /></RbacGate>} />
        <Route path="/bar/sorties-hors-vente" element={<RbacGate allow={['bar']}><BarSortiesHorsVente /></RbacGate>} />

        <Route path="/cuisine" element={<RbacGate allow={['cuisine']}><CuisineDashboard /></RbacGate>} />
        <Route path="/cuisine/catalogue" element={<RbacGate allow={['cuisine']}><CuisineCatalogue /></RbacGate>} />
        <Route path="/cuisine/stock" element={<RbacGate allow={['cuisine']}><CuisineStock /></RbacGate>} />
        <Route path="/cuisine/prelevements" element={<RbacGate allow={['cuisine']}><CuisinePrelevements /></RbacGate>} />
        <Route path="/cuisine/mouvements" element={<RbacGate allow={['cuisine']}><CuisineMouvements /></RbacGate>} />
        <Route path="/cuisine/sorties-hors-vente" element={<RbacGate allow={['cuisine']}><CuisineSortiesHorsVente /></RbacGate>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
    </>
  )
}
