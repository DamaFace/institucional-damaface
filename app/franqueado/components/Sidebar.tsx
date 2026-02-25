'use client'

import {
  Megaphone,
  X,
  Newspaper,
  Users2,
  Home,
  LifeBuoy,
  GraduationCap,
  BrainCircuit,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FolderOpen,
  BriefcaseBusiness,
  Award,
  ClipboardCheck,
  Search,
  Trophy,
  ClipboardList,
  Wrench,
  Store,
  LucideIcon,
  PanelLeft,
  PanelRight
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useState, useMemo } from 'react'
import clsx from 'clsx'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
}

interface NavItem {
  id: string
  name: string
  icon: LucideIcon
  route: string
  roles?: string[]
  hasSubModules?: boolean
  subModules?: NavItem[]
}

const ALL_ROLES = ['SUPERADMIN', 'ADMIN', 'FRANQUEADO', 'FUNCIONARIO']
const ADMIN_ROLES = ['SUPERADMIN']
const FRANQUEADO_ROLES = ['SUPERADMIN', 'FRANQUEADO']

const MARKETING_SUBMODULES: NavItem[] = [
  { id: 'drive', name: 'Drive', icon: FolderOpen, route: '/franqueado/marketing/drive' },
  { id: 'trafego', name: 'Tráfego', icon: TrendingUp, route: '/franqueado/marketing/trafego' }
]

const EXCELENCIA_SUBMODULES: NavItem[] = [
  { id: 'auto-avaliacao', name: 'Auto Avaliação', icon: ClipboardCheck, route: '/franqueado/excelencia/auto-avaliacao', roles: ['FRANQUEADO', 'SUPERADMIN'] },
  { id: 'auditoria', name: 'Auditoria', icon: Search, route: '/franqueado/excelencia/auditoria', roles: ADMIN_ROLES },
  { id: 'ranking', name: 'Ranking', icon: Trophy, route: '/franqueado/excelencia/ranking', roles: ALL_ROLES }
]

const CONSULTORIA_SUBMODULES: NavItem[] = [
  { id: 'gestao', name: 'Gestão', icon: ClipboardList, route: '/franqueado/consultoria/gestao', roles: FRANQUEADO_ROLES },
  { id: 'comercial', name: 'Comercial', icon: Store, route: '/franqueado/consultoria/comercial', roles: ALL_ROLES },
  { id: 'tecnico', name: 'Técnico', icon: Wrench, route: '/franqueado/consultoria/tecnico', roles: ALL_ROLES }
]

const NAV_LINKS: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: Home, route: '/franqueado/dashboard', roles: ALL_ROLES },
  { id: 'academy', name: 'Academy', icon: GraduationCap, route: '/franqueado/academy', roles: ALL_ROLES },
  { id: 'ajuda', name: 'Ajuda', icon: HelpCircle, route: '/franqueado/ajuda', roles: ALL_ROLES },
  { id: 'suporte', name: 'Suporte', icon: LifeBuoy, route: '/franqueado/suporte', roles: ALL_ROLES },
  //{ id: 'consultoria', name: 'Consultoria', icon: BriefcaseBusiness, route: '/franqueado/consultoria', roles: FRANQUEADO_ROLES, hasSubModules: true, subModules: CONSULTORIA_SUBMODULES },
  { id: 'comunicados', name: 'Comunicados', icon: Newspaper, route: '/franqueado/comunicados', roles: ALL_ROLES },
  //{ id: 'damaai', name: 'Dama.ai', icon: BrainCircuit, route: '/franqueado/damaai', roles: ALL_ROLES },
  { id: 'marketing', name: 'Marketing', icon: Megaphone, route: '/franqueado/marketing', roles: ALL_ROLES, hasSubModules: true, subModules: MARKETING_SUBMODULES },
  //{ id: 'excelencia', name: 'Programa de Excelência', icon: Award, route: '/franqueado/excelencia', roles: ['SUPERADMIN', 'FRANQUEADO'], hasSubModules: true, subModules: EXCELENCIA_SUBMODULES },
  { id: 'usuarios', name: 'Usuarios', icon: Users2, route: '/franqueado/usuarios', roles: ADMIN_ROLES },
]

const Sidebar = ({ isOpen, onClose, onToggle }: SidebarProps) => {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)

  const allowedLinks = useMemo(() => {
    if (!user) return []
    return NAV_LINKS.filter(link => !link.roles || link.roles.includes(user.role))
  }, [user])

  const isActive = (route: string) => pathname?.startsWith(route)

  const handleNavigation = (item: NavItem) => {
    if (item.hasSubModules) {
      setExpandedMenu(prev => (prev === item.id ? null : item.id))
    } else {
      router.push(item.route)
      // On mobile, close sidebar after navigation
      if (window.innerWidth < 1024) {
        onClose()
      }
    }
  }

  return (
    <>
      {/* Toggle Button - Premium Floating Style */}
      <button
        onClick={onToggle}
        className={clsx(
          'fixed top-20 z-40 p-2 bg-gray-800 border-y border-r border-gray-700 rounded-r-lg shadow-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-300 ease-in-out',
          isOpen ? 'left-64' : 'left-0'
        )}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isOpen ? <PanelLeft className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
      </button>

      <aside
        className={clsx(
          'sidebar-custom fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gray-900 border-r border-gray-700 z-30 transform transition-transform duration-300 ease-in-out overflow-y-auto shadow-lg',
          { 'translate-x-0': isOpen, '-translate-x-full': !isOpen }
        )}
      >
        <div className="lg:hidden flex justify-end p-4">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700" aria-label="Fechar menu">
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <nav className="px-4 pb-4">
          <div className="space-y-2">
            {allowedLinks.map((item) => {
              const active = isActive(item.route)
              const isExpanded = expandedMenu === item.id

              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleNavigation(item)}
                    className={clsx(
                      'w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors',
                      active && !item.hasSubModules
                        ? 'bg-pink-900/30 text-pink-400 border border-pink-800'
                        : 'text-gray-300 hover:bg-gray-700'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {item.hasSubModules && (
                      isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {item.hasSubModules && isExpanded && item.subModules && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.subModules
                        .filter(sub => !sub.roles || sub.roles.includes(user?.role || ''))
                        .map((subModule) => {
                          const subActive = isActive(subModule.route)
                          return (
                            <button
                              key={subModule.id}
                              onClick={() => {
                                router.push(subModule.route)
                                onClose()
                              }}
                              className={clsx(
                                'w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-left transition-colors text-sm',
                                subActive
                                  ? 'bg-pink-900/20 text-pink-400 border border-pink-800/50'
                                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
                              )}
                            >
                              <subModule.icon className="w-4 h-4" />
                              <span className="font-medium">{subModule.name}</span>
                            </button>
                          )
                        })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}

      <style jsx>{`
        @media (min-width: 1024px) {
          .sidebar-custom::-webkit-scrollbar { width: 6px; }
          .sidebar-custom::-webkit-scrollbar-track { background: transparent; }
          .sidebar-custom::-webkit-scrollbar-thumb { background-color: #475569; border-radius: 9999px; transition: background-color 0.2s; }
          .sidebar-custom::-webkit-scrollbar-thumb:hover { background-color: #64748b; }
          .sidebar-custom { scrollbar-width: thin; scrollbar-color: #475569 transparent; }
        }
        @media (max-width: 1023px) {
          .sidebar-custom::-webkit-scrollbar { display: none; }
          .sidebar-custom { -ms-overflow-style: none; scrollbar-width: none; }
        }
      `}</style>
    </>
  )
}

export default Sidebar;