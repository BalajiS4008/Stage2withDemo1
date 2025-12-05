import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LogOut,
  Menu,
  X,
  Building2,
  User,
  ChevronDown,
  ChevronRight,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Palette,
  ChevronLeft,
  ChevronsUpDown
} from 'lucide-react';
import { getLastSyncTime } from '../services/syncService';
import { getNavigationConfig } from '../config/navigationConfig';

const Layout = ({ children, currentPage, onNavigate, isOnline, isSyncing, onSync }) => {
  const { user, logout, isAdmin } = useAuth();
  const { toggleTheme, isTailwind } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Update last sync time
  useEffect(() => {
    const updateSyncTime = () => {
      const syncTime = getLastSyncTime();
      setLastSyncTime(syncTime);
    };

    updateSyncTime();
    const interval = setInterval(updateSyncTime, 10000); // Update every 10 seconds

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

  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);

  // Get navigation configuration from shared config
  const navigation = getNavigationConfig({
    isAdmin,
    toolsExpanded,
    setToolsExpanded,
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">ByCodez</h1>
              <p className="text-xs text-gray-600">Construction Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sync Status Indicator */}
            <button
              onClick={onSync}
              disabled={isSyncing || !isOnline}
              className={`p-2 rounded-lg transition-colors ${
                isSyncing
                  ? 'bg-blue-50 cursor-wait'
                  : isOnline
                    ? 'hover:bg-gray-100'
                    : 'bg-gray-50 cursor-not-allowed'
              }`}
              title={
                isSyncing
                  ? 'Syncing...'
                  : isOnline
                    ? `Last sync: ${formatSyncTime(lastSyncTime)}`
                    : 'Offline'
              }
            >
              {isSyncing ? (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              ) : isOnline ? (
                <Cloud className="w-5 h-5 text-green-600" />
              ) : (
                <CloudOff className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
        style={{ width: sidebarCollapsed ? '80px' : '256px' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className="p-4 border-b border-gray-200 hidden lg:flex items-center justify-between">
            <div className={`flex items-center gap-3 transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              <div className="bg-primary-600 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 whitespace-nowrap">ByCodez</h1>
                <p className="text-xs text-gray-600 whitespace-nowrap">Construction</p>
              </div>
            </div>
            {/* Collapsed Logo */}
            {sidebarCollapsed && (
              <div className="flex items-center justify-center w-full">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
            {/* Toggle Button */}
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Expand Button (when collapsed) */}
          {sidebarCollapsed && (
            <div className="hidden lg:flex justify-center p-2 border-b border-gray-200">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Expand sidebar"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}

          {/* User Info */}
          <div className="p-3 border-b border-gray-200">
            {sidebarCollapsed ? (
              <div className="flex justify-center" title={`${user?.name} (${user?.role})`}>
                <div className="bg-primary-100 p-2 rounded-full">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 p-2 rounded-full">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 overflow-y-auto">
            <ul className={`space-y-1 ${sidebarCollapsed ? 'px-1' : 'px-2'}`}>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                if (item.isExpandable) {
                  if (item.requiresAdmin && !isAdmin()) return null;

                  // In collapsed mode, show with popup submenu
                  if (sidebarCollapsed) {
                    const isParentActive = currentPage === item.id;
                    return (
                      <li key={item.id} className="relative mb-1">
                        {/* Structural separator line above */}
                        <div className="h-px bg-gray-200 mx-2 mb-2"></div>

                        <div className={`group relative w-full rounded-lg transition-all border-2 ${
                          isParentActive
                            ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                            : item.isExpanded
                              ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                        }`}>
                          {/* Main clickable area - navigates to parent page */}
                          <button
                            onClick={() => handleNavigate(item.id)}
                            className="w-full flex flex-col items-center justify-center px-0 py-3 transition-all"
                          >
                            <div className="relative mb-1">
                              <Icon className={`w-5 h-5 flex-shrink-0 ${isParentActive || item.isExpanded ? 'stroke-[2.5]' : 'stroke-2'}`} />
                            </div>

                            {/* Child count indicator */}
                            <div className={`flex items-center gap-0.5 text-[9px] font-semibold ${
                              isParentActive ? 'text-white' : item.isExpanded ? 'text-primary-600' : 'text-gray-500'
                            }`}>
                              <span>{item.children.length}</span>
                              <span className="text-[7px]">items</span>
                            </div>
                          </button>

                          {/* Expand/collapse button - small button at bottom */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              item.onExpand();
                            }}
                            className={`w-full py-1 border-t transition-all ${
                              isParentActive
                                ? 'border-primary-500 hover:bg-primary-700'
                                : item.isExpanded
                                  ? 'border-primary-200 hover:bg-primary-100'
                                  : 'border-gray-200 hover:bg-gray-100'
                            }`}
                            title={item.isExpanded ? "Collapse menu" : "Expand menu"}
                          >
                            <ChevronsUpDown className={`w-3 h-3 mx-auto ${
                              isParentActive ? 'text-white' : item.isExpanded ? 'text-primary-600' : 'text-gray-400'
                            }`} />
                          </button>

                          {/* Tooltip showing parent name */}
                          <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-xs text-gray-300 mt-0.5">
                              Click to navigate • {item.children.length} sub-items
                            </div>
                            <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                          </div>
                        </div>

                        {/* Structural separator line below */}
                        <div className="h-px bg-gray-200 mx-2 mt-2"></div>

                        {/* Dropdown menu for children in collapsed mode */}
                        {item.isExpanded && item.children && (
                          <>
                            {/* Overlay to close submenu when clicking outside */}
                            <div
                              onClick={item.onExpand}
                              className="fixed inset-0 z-[1150]"
                              style={{ background: 'transparent' }}
                            />
                            <div
                              className="absolute left-[70px] top-0 rounded-lg z-[1200] min-w-[220px]"
                              style={{
                                background: 'linear-gradient(135deg, #2C3E50 0%, #1a252f 100%)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                                border: '1px solid rgba(79, 70, 229, 0.3)',
                                animation: 'slideInFromLeft 0.2s ease-out'
                              }}
                            >
                              <div className="p-3">
                                {/* Group Title */}
                                <div
                                  className="font-semibold text-white mb-2 px-2 text-sm pb-2"
                                  style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                                >
                                  {item.name}
                                </div>

                                {/* Group Items */}
                                {item.children.map((child) => {
                                  const ChildIcon = child.icon;
                                  const isChildActive = currentPage === child.id;
                                  return (
                                    <button
                                      key={child.id}
                                      onClick={() => {
                                        handleNavigate(child.id);
                                        item.onExpand(); // Close the submenu after navigation
                                      }}
                                      className="w-full flex items-center gap-2 py-2 px-3 rounded mb-1 text-sm font-medium transition-all"
                                      style={{
                                        background: isChildActive ? 'rgba(79, 70, 229, 0.3)' : 'transparent',
                                        color: isChildActive ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                                        fontWeight: isChildActive ? '600' : '500'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isChildActive) {
                                          e.currentTarget.style.background = 'rgba(79, 70, 229, 0.2)';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isChildActive) {
                                          e.currentTarget.style.background = 'transparent';
                                        }
                                      }}
                                    >
                                      <ChildIcon className="w-[18px] h-[18px]" />
                                      <span>{child.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  }

                  // In expanded mode, show expandable menu
                  return (
                    <li key={item.id}>
                      <div className="space-y-1">
                        <button
                          onClick={item.onExpand}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium text-sm">{item.name}</span>
                          </div>
                          {item.isExpanded ? (
                            <ChevronDown className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 flex-shrink-0" />
                          )}
                        </button>

                        {item.isExpanded && (
                          <ul className="ml-4 space-y-1">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const isChildActive = currentPage === child.id;

                              return (
                                <li key={child.id}>
                                  <button
                                    onClick={() => handleNavigate(child.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                      isChildActive
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    <ChildIcon className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-medium text-sm">{child.name}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavigate(item.id)}
                      className={`group relative w-full flex items-center gap-3 rounded-lg transition-all ${
                        sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title={sidebarCollapsed ? item.name : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`} />
                      {!sidebarCollapsed && <span className="font-medium text-sm">{item.name}</span>}

                      {/* Tooltip for collapsed state */}
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                          {item.name}
                          <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sync Status & Actions */}
          <div className="p-3 border-t border-gray-200 space-y-2">
            {sidebarCollapsed ? (
              <>
                {/* Collapsed Sync Button */}
                <button
                  onClick={onSync}
                  disabled={isSyncing || !isOnline}
                  className={`group relative w-full flex items-center justify-center p-2.5 rounded-lg transition-colors ${
                    isSyncing || !isOnline
                      ? 'bg-gray-100 cursor-not-allowed'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {isSyncing ? (
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mx-auto" />
                  ) : isOnline ? (
                    <Cloud className="w-5 h-5 text-green-600 mx-auto" />
                  ) : (
                    <CloudOff className="w-5 h-5 text-gray-400 mx-auto" />
                  )}

                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                    {isSyncing ? 'Syncing...' : isOnline ? `Sync Data • ${formatSyncTime(lastSyncTime)}` : 'Offline'}
                    <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                </button>

                {/* Collapsed Theme Button */}
                <button
                  onClick={toggleTheme}
                  className="group relative w-full flex items-center justify-center p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Palette className="w-5 h-5 text-purple-600 mx-auto" />

                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                    Switch to {isTailwind ? 'Bootstrap' : 'Tailwind'}
                    <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                </button>

                {/* Collapsed Logout Button */}
                <button
                  onClick={handleLogout}
                  className="group relative w-full flex items-center justify-center p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5 text-red-600 mx-auto" />

                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                    Logout
                    <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                </button>
              </>
            ) : (
              <>
                {/* Expanded Sync Status */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isOnline ? (
                        <Cloud className="w-4 h-4 text-green-600" />
                      ) : (
                        <CloudOff className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-xs font-medium text-gray-700">
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    {isSyncing ? (
                      <CheckCircle className="w-4 h-4 text-blue-600 animate-pulse" />
                    ) : lastSyncTime ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {isSyncing ? (
                      <span className="text-blue-600 font-medium">Syncing...</span>
                    ) : (
                      <span>Last sync: {formatSyncTime(lastSyncTime)}</span>
                    )}
                  </div>
                  <button
                    onClick={onSync}
                    disabled={isSyncing || !isOnline}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isSyncing || !isOnline
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>

                {/* Expanded Theme Switcher */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-gray-700">Theme</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-white rounded-full text-purple-600 font-medium">
                      {isTailwind ? 'Tailwind' : 'Bootstrap'}
                    </span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Palette className="w-3 h-3" />
                    Switch to {isTailwind ? 'Bootstrap' : 'Tailwind'}
                  </button>
                </div>

                {/* Expanded Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={`pt-20 lg:pt-0 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

