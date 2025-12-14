import Layout from "./Layout.jsx";

import Pulse from "./Pulse";

import Chat from "./Chat";

import Inventory from "./Inventory";

import Customers from "./Customers";

import Financials from "./Financials";

import InsightsEngine from "./InsightsEngine";

import Welcome from "./Welcome";

import Onboarding from "./Onboarding";

import Marketplaces from "./Marketplaces";

import Settings from "./Settings";

import Payments from "./Payments";

import InventoryOnboarding from "./InventoryOnboarding";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Pulse: Pulse,
    
    Chat: Chat,
    
    Inventory: Inventory,
    
    Customers: Customers,
    
    Financials: Financials,
    
    InsightsEngine: InsightsEngine,
    
    Welcome: Welcome,
    
    Onboarding: Onboarding,
    
    Marketplaces: Marketplaces,
    
    Settings: Settings,
    
    Payments: Payments,
    
    InventoryOnboarding: InventoryOnboarding,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Pulse />} />
                
                
                <Route path="/Pulse" element={<Pulse />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/Inventory" element={<Inventory />} />
                
                <Route path="/Customers" element={<Customers />} />
                
                <Route path="/Financials" element={<Financials />} />
                
                <Route path="/InsightsEngine" element={<InsightsEngine />} />
                
                <Route path="/Welcome" element={<Welcome />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/Marketplaces" element={<Marketplaces />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Payments" element={<Payments />} />
                
                <Route path="/InventoryOnboarding" element={<InventoryOnboarding />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}