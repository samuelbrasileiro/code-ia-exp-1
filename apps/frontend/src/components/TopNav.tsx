import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

type LinkItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

const links: LinkItem[] = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 11.5l9-7 9 7" />
        <path d="M5 10.5V20h5v-5h4v5h5v-9.5" />
      </svg>
    )
  },
  {
    to: "/questions",
    label: "Questions",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    )
  },
  {
    to: "/exams",
    label: "Exams",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 4h6" />
        <path d="M9 2h6v4H9z" />
        <path d="M5 6h14v16H5z" />
        <path d="M8 10h8" />
        <path d="M8 14h8" />
      </svg>
    )
  },
  {
    to: "/generate",
    label: "Generate PDFs",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M12 13v6" />
        <path d="M9 16l3 3 3-3" />
      </svg>
    )
  },
  {
    to: "/correction",
    label: "Correction",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    )
  }
];

export default function TopNav() {
  return (
    <header className="toolbar">
      <div className="toolbar-inner">
        <div className="brand">Exam Builder</div>
        <nav className="nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
