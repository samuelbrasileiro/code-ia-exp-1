import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/questions", label: "Questions" },
  { to: "/exams", label: "Exams" },
  { to: "/generate", label: "Generate PDFs" },
  { to: "/correction", label: "Correction" }
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
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
