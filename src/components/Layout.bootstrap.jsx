import React, { useState, useEffect } from 'react';
import { Nav, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Cloud,
  CloudOff,
  RefreshCw,
  Palette,
  ChevronsUpDown,
  Building2
} from 'lucide-react';
import { getLastSyncTime } from '../services/syncService';
import { getNavigationConfig } from '../config/navigationConfig';

const LayoutBootstrap = ({ children, currentPage, onNavigate, isOnline, isSyncing, onSync }) => {
  const { user, logout, isAdmin } = useAuth();
  const { toggleTheme, isTailwind } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [inventoryExpanded, setInventoryExpanded] = useState(false);
  const [laborExpanded, setLaborExpanded] = useState(false);
  const [budgetExpanded, setBudgetExpanded] = useState(false);
  const [retentionExpanded, setRetentionExpanded] = useState(false);
  const [changeOrdersExpanded, setChangeOrdersExpanded] = useState(false);
  const [documentsExpanded, setDocumentsExpanded] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);

  useEffect(() => {
    const updateSyncTime = () => {
      const syncTime = getLastSyncTime();
      setLastSyncTime(syncTime);
    };
    updateSyncTime();
    const interval = setInterval(updateSyncTime, 10000);
    return () => clearInterval(interval);
  }, [isSyncing]);

  const formatSyncTime = (isoString) => {
    if (!isoString) return 'Never';
    const syncDate = new Date(isoString);
    const now = new Date();
    const diffMs = now - syncDate;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Get navigation configuration from shared config
  const navigation = getNavigationConfig({
    isAdmin,
    toolsExpanded,
    setToolsExpanded,
    inventoryExpanded,
    setInventoryExpanded,
    laborExpanded,
    setLaborExpanded,
    budgetExpanded,
    setBudgetExpanded,
    retentionExpanded,
    setRetentionExpanded,
    changeOrdersExpanded,
    setChangeOrdersExpanded,
    documentsExpanded,
    setDocumentsExpanded,
    adminExpanded,
    setAdminExpanded
  });

  const handleNavigate = (pageId) => {
    onNavigate(pageId);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className={`sidebar d-lg-block ${sidebarOpen ? 'show' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Logo & Toggle Button */}
        <div className={`border-bottom border-secondary d-flex align-items-center justify-content-between ${sidebarCollapsed ? 'p-2 justify-content-center' : 'p-3'}`}>
          {!sidebarCollapsed ? (
            <>
              <div className="d-flex align-items-center gap-2">
                <div className="bg-primary p-2 rounded" style={{ background: '#5B4DFF' }}>
                  <Building2 className="text-white" size={24} />
                </div>
                <div>
                  <h6 className="mb-0 text-white fw-bold">ByCodez</h6>
                  <small className="text-white-50" style={{ fontSize: '10px' }}>Construction</small>
                </div>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="btn btn-sm btn-link text-white-50 p-1 d-none d-lg-block"
                title="Collapse sidebar"
                style={{ textDecoration: 'none' }}
              >
                <ChevronLeft size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="btn btn-sm btn-link text-white-50 p-1 d-none d-lg-block"
              title="Expand sidebar"
              style={{ textDecoration: 'none' }}
            >
              <Menu size={22} />
            </button>
          )}
        </div>

        {/* User Info */}
        <div className={`border-bottom border-secondary ${sidebarCollapsed ? 'p-2' : 'p-3'}`}>
          {sidebarCollapsed ? (
            <div className="d-flex justify-content-center" title={`${user?.username} (${user?.role})`}>
              <div className="bg-primary bg-opacity-25 p-2 rounded-circle">
                <User className="text-white" size={18} />
              </div>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary bg-opacity-25 p-2 rounded-circle">
                <User className="text-white" size={20} />
              </div>
              <div className="flex-grow-1">
                <div className="text-white fw-semibold small">{user?.username}</div>
                <Badge bg={isAdmin() ? 'warning' : 'info'} className="small">
                  {user?.role || 'user'}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Navigation - Scrollable Area */}
        <Nav className={`flex-column ${sidebarCollapsed ? 'p-0 py-1' : 'p-3'}`}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            // For expandable items (Tools, Admin)
            if (item.isExpandable) {
              // In collapsed mode, show as single icon with clickable submenu
              if (sidebarCollapsed) {
                const isParentActive = currentPage === item.id;
                return (
                  <div key={item.id} className="position-relative mb-3">
                    {/* Structural separator line above */}
                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 8px 8px' }}></div>

                    <div
                      className="nav-item-hover"
                      style={{
                        background: isParentActive ? '#5B4DFF' : item.isExpanded ? 'rgba(91, 77, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        position: 'relative',
                        border: isParentActive ? '2px solid #5B4DFF' : item.isExpanded ? '2px solid rgba(91, 77, 255, 0.4)' : '2px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: isParentActive ? '0 4px 12px rgba(91, 77, 255, 0.4)' : item.isExpanded ? '0 2px 8px rgba(91, 77, 255, 0.2)' : 'none',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Main clickable area - navigates to parent page */}
                      <div
                        onClick={() => handleNavigate(item.id)}
                        style={{
                          cursor: 'pointer',
                          padding: '12px 0',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div style={{ position: 'relative', marginBottom: '4px' }}>
                          <Icon
                            size={22}
                            style={{
                              strokeWidth: isParentActive || item.isExpanded ? 2.5 : 2,
                              color: isParentActive ? 'white' : 'inherit'
                            }}
                          />
                        </div>

                        {/* Child count indicator */}
                        <div style={{
                          fontSize: '9px',
                          fontWeight: 'bold',
                          color: isParentActive ? 'white' : item.isExpanded ? '#5B4DFF' : 'rgba(255, 255, 255, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <span>{item.children.length}</span>
                          <span style={{ fontSize: '7px' }}>items</span>
                        </div>
                      </div>

                      {/* Expand/collapse button - small button at bottom */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onExpand();
                        }}
                        style={{
                          cursor: 'pointer',
                          padding: '4px 0',
                          borderTop: isParentActive ? '1px solid rgba(255, 255, 255, 0.3)' : item.isExpanded ? '1px solid rgba(91, 77, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isParentActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(91, 77, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                        title={item.isExpanded ? "Collapse menu" : "Expand menu"}
                      >
                        <ChevronsUpDown
                          size={12}
                          style={{
                            color: isParentActive ? 'white' : item.isExpanded ? '#5B4DFF' : 'rgba(255, 255, 255, 0.4)'
                          }}
                        />
                      </div>

                      {/* Tooltip showing parent name and navigation hint */}
                      <span className="sidebar-tooltip">
                        <div className="fw-bold">{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '2px' }}>
                          Click to navigate • {item.children.length} sub-items
                        </div>
                      </span>
                    </div>

                    {/* Structural separator line below */}
                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.15)', margin: '8px 8px 0' }}></div>

                    {/* Dropdown menu for children in collapsed mode */}
                    {item.isExpanded && item.children && (
                      <>
                        {/* Overlay to close submenu when clicking outside */}
                        <div
                          onClick={item.onExpand}
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1150,
                            background: 'transparent'
                          }}
                        />
                        <div
                          className="collapsed-submenu"
                          style={{
                            position: 'absolute',
                            left: '70px',
                            top: '0',
                            background: 'linear-gradient(135deg, #2C3E50 0%, #1a252f 100%)',
                            borderRadius: '8px',
                            padding: '12px',
                            minWidth: '220px',
                            zIndex: 1200,
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                            border: '1px solid rgba(91, 77, 255, 0.3)',
                            animation: 'slideInFromLeft 0.2s ease-out'
                          }}
                        >
                          <div className="fw-semibold text-white mb-2 px-2" style={{ fontSize: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                            {item.name}
                          </div>
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const isChildActive = currentPage === child.id;
                            return (
                              <Nav.Link
                                key={child.id}
                                onClick={() => {
                                  handleNavigate(child.id);
                                  item.onExpand(); // Close the submenu after navigation
                                }}
                                className="d-flex align-items-center gap-2 text-white-50 py-2 px-3 rounded mb-1"
                                style={{
                                  cursor: 'pointer',
                                  background: isChildActive ? 'rgba(91, 77, 255, 0.3)' : 'transparent',
                                  color: isChildActive ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                                  transition: 'all 0.2s ease',
                                  fontSize: '13px',
                                  fontWeight: isChildActive ? '600' : '500'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isChildActive) {
                                    e.currentTarget.style.background = 'rgba(91, 77, 255, 0.2)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isChildActive) {
                                    e.currentTarget.style.background = 'transparent';
                                  }
                                }}
                              >
                                <ChildIcon size={18} />
                                <span>{child.name}</span>
                              </Nav.Link>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              }

              // In expanded mode, show expandable menu
              return (
                <div key={item.id}>
                  <Nav.Link
                    onClick={item.onExpand}
                    className="d-flex align-items-center justify-content-between text-white-50 py-2 px-3 rounded mb-1"
                    style={{
                      cursor: 'pointer',
                      background: item.isExpanded ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <Icon size={18} />
                      <span className="small fw-medium">{item.name}</span>
                    </div>
                    {item.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </Nav.Link>
                  {item.isExpanded && item.children && (
                    <div className="ms-3">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = currentPage === child.id;
                        return (
                          <Nav.Link
                            key={child.id}
                            onClick={() => handleNavigate(child.id)}
                            className="d-flex align-items-center gap-2 text-white-50 py-2 px-3 rounded mb-1 small"
                            style={{
                              cursor: 'pointer',
                              background: isChildActive ? 'rgba(91, 77, 255, 0.3)' : 'transparent',
                              color: isChildActive ? '#fff' : 'rgba(255, 255, 255, 0.7)'
                            }}
                          >
                            <ChildIcon size={16} />
                            <span>{child.name}</span>
                          </Nav.Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={item.id} className="position-relative mb-1">
                <Nav.Link
                  onClick={() => handleNavigate(item.id)}
                  className={`nav-item-hover ${sidebarCollapsed ? 'nav-item-collapsed' : 'd-flex align-items-center gap-3 py-3 px-3'}`}
                  style={{
                    cursor: 'pointer',
                    background: isActive ? 'rgba(91, 77, 255, 0.15)' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                    position: 'relative',
                    borderLeft: sidebarCollapsed && isActive ? '3px solid #5B4DFF' : sidebarCollapsed ? '3px solid transparent' : 'none',
                    borderRadius: sidebarCollapsed ? '0' : '8px',
                    transition: 'all 0.2s ease'
                  }}
                  data-tooltip={item.name}
                >
                  <div className={sidebarCollapsed ? 'd-flex justify-content-center align-items-center' : ''}
                       style={sidebarCollapsed ? { width: '100%', height: '48px' } : {}}>
                    <Icon size={22} style={{ strokeWidth: isActive ? 2.5 : 2 }} />
                  </div>
                  {!sidebarCollapsed && <span className="fw-medium" style={{ fontSize: '14px' }}>{item.name}</span>}

                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <span className="sidebar-tooltip">
                      {item.name}
                    </span>
                  )}
                </Nav.Link>
              </div>
            );
          })}
        </Nav>

        {/* Sync Status & Actions */}
        <div className={`border-top border-secondary ${sidebarCollapsed ? 'p-0 pt-2' : 'p-3'}`}>
          {sidebarCollapsed ? (
            <>
              {/* Collapsed: Icon-only buttons with tooltips */}
              <div className="d-flex flex-column align-items-stretch gap-1">
                <div className="position-relative">
                  <button
                    onClick={onSync}
                    disabled={isSyncing || !isOnline}
                    className="btn btn-sm d-flex justify-content-center align-items-center w-100 action-btn-hover"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderLeft: '3px solid transparent',
                      borderRadius: '0',
                      padding: '0',
                      height: '48px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSyncing ? (
                      <RefreshCw size={20} className="text-info spin" />
                    ) : isOnline ? (
                      <Cloud size={20} className="text-success" />
                    ) : (
                      <CloudOff size={20} className="text-secondary" />
                    )}
                    <span className="sidebar-tooltip">
                      {isSyncing ? 'Syncing...' : isOnline ? `Sync Data • ${formatSyncTime(lastSyncTime)}` : 'Offline'}
                    </span>
                  </button>
                </div>
                <div className="position-relative">
                  <button
                    onClick={toggleTheme}
                    className="btn btn-sm d-flex justify-content-center align-items-center w-100 action-btn-hover"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderLeft: '3px solid transparent',
                      borderRadius: '0',
                      padding: '0',
                      height: '48px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Palette size={20} className="text-white" />
                    <span className="sidebar-tooltip">
                      Switch to {isTailwind ? 'Bootstrap' : 'Tailwind'}
                    </span>
                  </button>
                </div>
                <div className="position-relative">
                  <button
                    onClick={handleLogout}
                    className="btn btn-sm d-flex justify-content-center align-items-center w-100 action-btn-hover"
                    style={{
                      background: 'rgba(220, 53, 69, 0.15)',
                      border: 'none',
                      borderLeft: '3px solid transparent',
                      borderRadius: '0',
                      padding: '0',
                      height: '48px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <LogOut size={20} className="text-danger" />
                    <span className="sidebar-tooltip">
                      Logout
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Expanded: Full info */}
              <div className="bg-dark bg-opacity-25 rounded p-3 mb-2">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    {isOnline ? <Cloud size={16} className="text-success" /> : <CloudOff size={16} className="text-secondary" />}
                    <small className="text-white fw-medium">{isOnline ? 'Online' : 'Offline'}</small>
                  </div>
                  {isSyncing && <RefreshCw size={16} className="text-primary spin" />}
                </div>
                <small className="text-white-50 d-block mb-2">
                  {isSyncing ? <span className="text-info">Syncing...</span> : `Last sync: ${formatSyncTime(lastSyncTime)}`}
                </small>
                <Button
                  onClick={onSync}
                  disabled={isSyncing || !isOnline}
                  size="sm"
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{ background: '#5B4DFF', border: 'none' }}
                >
                  <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>

              {/* Theme Switcher */}
              <div className="bg-gradient-primary rounded p-3 mb-2" style={{ background: 'linear-gradient(135deg, #7B6FFF 0%, #5B4DFF 100%)' }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <Palette size={16} className="text-white" />
                    <small className="text-white fw-medium">Theme</small>
                  </div>
                  <Badge bg="light" text="dark" className="small">
                    {isTailwind ? 'Tailwind' : 'Bootstrap'}
                  </Badge>
                </div>
                <Button
                  onClick={toggleTheme}
                  size="sm"
                  variant="light"
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  <Palette size={14} />
                  <span className="small">Switch to {isTailwind ? 'Bootstrap' : 'Tailwind'}</span>
                </Button>
              </div>

              {/* Logout */}
              <Button
                onClick={handleLogout}
                variant="danger"
                className="w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1040
          }}
        />
      )}

      {/* Mobile Header */}
      <div className="d-lg-none fixed-top bg-white border-bottom p-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary p-2 rounded" style={{ background: '#5B4DFF' }}>
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h6 className="mb-0 fw-bold">ByCodez</h6>
              <small className="text-muted">Construction Tracker</small>
            </div>
          </div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-grow-1"
        style={{
          marginLeft: sidebarCollapsed ? '70px' : '260px',
          padding: '2rem',
          background: '#F9FAFB',
          minHeight: '100vh',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="d-lg-none" style={{ height: '70px' }}></div>
        {children}
      </div>

      {/* Responsive Styles */}
      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(180deg, #2C3E50 0%, #1a252f 100%);
          width: 260px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
          overflow-x: hidden;
          z-index: 1050;
        }

        .sidebar.collapsed {
          width: 70px;
        }

        @media (max-width: 992px) {
          .sidebar {
            transform: translateX(-100%) !important;
            width: 260px !important;
          }
          .sidebar.show {
            transform: translateX(0) !important;
          }
          .flex-grow-1 {
            margin-left: 0 !important;
          }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Smooth transitions for sidebar elements */
        .sidebar * {
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        /* Hide scrollbar but keep functionality */
        .sidebar::-webkit-scrollbar {
          width: 5px;
        }

        .sidebar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .sidebar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }

        .sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Navigation item hover effects */
        .nav-item-hover {
          position: relative;
          overflow: visible;
        }

        .nav-item-hover:hover {
          background: rgba(91, 77, 255, 0.25) !important;
        }

        /* Collapsed navigation item styles */
        .nav-item-collapsed {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 !important;
          margin: 0;
          height: 48px;
        }

        .sidebar.collapsed .nav-item-hover:hover {
          background: rgba(91, 77, 255, 0.2) !important;
          border-left-color: rgba(91, 77, 255, 0.5) !important;
        }

        /* Tooltip styles for collapsed sidebar - Using real HTML elements */
        .sidebar-tooltip {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          padding: 10px 16px;
          background: linear-gradient(135deg, #2C3E50 0%, #1a252f 100%);
          color: white;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          border-radius: 8px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1100;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(91, 77, 255, 0.2);
        }

        /* Tooltip arrow using ::before */
        .sidebar-tooltip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 7px solid transparent;
          border-right-color: #2C3E50;
        }

        /* Show tooltip on hover */
        .nav-item-hover:hover .sidebar-tooltip {
          opacity: 1;
          visibility: visible;
          left: calc(100% + 18px);
        }

        /* Smooth icon transitions */
        .nav-item-hover svg {
          transition: all 0.2s ease;
        }

        .nav-item-hover:hover svg {
          transform: scale(1.1);
        }

        /* Action button hover effects */
        .action-btn-hover:hover {
          background: rgba(91, 77, 255, 0.2) !important;
          border-left-color: rgba(91, 77, 255, 0.6) !important;
        }

        .action-btn-hover:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn-hover:disabled:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-left-color: transparent !important;
        }

        .action-btn-hover svg {
          transition: all 0.2s ease;
        }

        .action-btn-hover:hover svg {
          transform: scale(1.15);
        }

        .action-btn-hover:disabled:hover svg {
          transform: scale(1);
        }

        /* Show tooltip on action button hover */
        .action-btn-hover:hover .sidebar-tooltip {
          opacity: 1;
          visibility: visible;
          left: calc(100% + 18px);
        }

        /* Submenu animation */
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Submenu styles */
        .collapsed-submenu {
          animation: slideInFromLeft 0.2s ease-out;
        }

        .collapsed-submenu .nav-link:last-child {
          margin-bottom: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default LayoutBootstrap;

