import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

export interface SidebarMenuItem {
  to: string
  icon: ReactNode
  label: string
}

export interface SidebarMenuSection {
  label: string
  items: SidebarMenuItem[]
}

interface SidebarMenuProps {
  sections: SidebarMenuSection[]
  collapsed?: boolean
  onNavigate?: () => void
}

interface SidebarNavSectionProps {
  label: string
  collapsed?: boolean
}

function SidebarNavSection({ label, collapsed }: SidebarNavSectionProps) {
  if (collapsed) {
    return <div className="h-px bg-white/10 my-2 mx-2" />
  }

  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mt-4 mb-1">
      {label}
    </p>
  )
}

interface SidebarNavItemProps {
  item: SidebarMenuItem
  collapsed?: boolean
  onNavigate?: () => void
}

function SidebarNavItem({ item, collapsed, onNavigate }: SidebarNavItemProps) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 ${
          collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
        } ${
          isActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {item.icon}
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

export function SidebarMenu({ sections, collapsed, onNavigate }: SidebarMenuProps) {
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5" aria-label="Menu principal">
      {sections.map((section) => (
        <div key={section.label}>
          <SidebarNavSection label={section.label} collapsed={collapsed} />
          {section.items.map((item) => (
            <SidebarNavItem
              key={item.to}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  )
}
