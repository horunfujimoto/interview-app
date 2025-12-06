import { Button } from '@/atoms';
import { type LucideIcon, LogOut, User } from 'lucide-react';
import React from 'react';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';

interface HeaderProps {
  appName?: string;
  userName?: string;
  navItems?: {
    label: string;
    href?: string;
    icon?: LucideIcon;
    dropdownItems?: { label: string; href: string; }[];
  }[];
  onLogout?: () => void;
}

/**
 * Common Header Organism
 * @param {HeaderProps} props - The props for the component.
 */
export const Header = ({
  appName = 'AI面接アプリ',
  userName = 'ゲストユーザー',
  navItems = [],
  onLogout,
}: HeaderProps) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#home">{appName}</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {navItems.map((item, index) => (
              item.dropdownItems ? (
                <NavDropdown title={item.label} id={`nav-dropdown-${index}`} key={index}>
                  {item.dropdownItems.map((dropItem, dropIndex) => (
                    <NavDropdown.Item href={dropItem.href} key={dropIndex}>
                      {dropItem.label}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              ) : (
                <Nav.Link href={item.href} key={index} className="d-flex align-items-center">
                  {item.icon && <item.icon size={18} className="me-2" />}
                  {item.label}
                </Nav.Link>
              )
            ))}
          </Nav>
          <Nav>
            <NavDropdown title={<><User size={18} className="me-2" />{userName}</>} id="user-dropdown">
              <NavDropdown.Item href="#profile">プロフィール</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={onLogout}>
                <LogOut size={18} className="me-2" />ログアウト
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
