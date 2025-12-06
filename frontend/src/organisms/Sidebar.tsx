import { type LucideIcon, Home, BarChart2, Users, Settings, Briefcase, FileText } from 'lucide-react';
import React from 'react';
import { Nav } from 'react-bootstrap';

interface SidebarNavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  subItems?: SidebarNavItem[];
}

interface SidebarProps {
  navItems: SidebarNavItem[];
  title?: string;
}

/**
 * Common Sidebar Organism
 * @param {SidebarProps} props - The props for the component.
 */
export const Sidebar = ({ title = 'ナビゲーション', navItems }: SidebarProps) => {
  return (
    <div style={{ width: '250px', backgroundColor: '#f8f9fa', height: '100vh', padding: '1rem', borderRight: '1px solid #dee2e6' }}>
      {title && <h5 className="mb-3">{title}</h5>}
      <Nav className="flex-column">
        {navItems.map((item, index) => (
          <React.Fragment key={index}>
            <Nav.Link href={item.href} className="d-flex align-items-center py-2">
              {item.icon && <item.icon size={18} className="me-2" />}
              {item.label}
            </Nav.Link>
            {item.subItems && item.subItems.length > 0 && (
              <div className="ms-3">
                {item.subItems.map((subItem, subIndex) => (
                  <Nav.Link href={subItem.href} key={subIndex} className="d-flex align-items-center py-1 text-muted">
                    {subItem.icon && <subItem.icon size={16} className="me-2" />}
                    {subItem.label}
                  </Nav.Link>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </Nav>
    </div>
  );
};
