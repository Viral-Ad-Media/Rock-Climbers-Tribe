"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth-client";
import { Icons } from "./icons";

type MenuItem = {
  label: string;
  href: string;
  icon: keyof typeof Icons;
  count?: number;
  match?: string[];
  sub?: { label: string; href: string }[];
  adminOnly?: boolean;
};

export function AdminShell({
  children,
  siteName,
  userName,
  isAdmin,
  pendingComments,
}: {
  children: React.ReactNode;
  siteName: string;
  userName: string;
  isAdmin: boolean;
  pendingComments: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [folded, setFolded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      // Read after hydration so server and client markup match
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFolded(localStorage.getItem("wp-menu-folded") === "1");
    } catch {}
  }, []);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  const toggleFold = () => {
    setFolded((f) => {
      try {
        localStorage.setItem("wp-menu-folded", f ? "0" : "1");
      } catch {}
      return !f;
    });
  };

  const menu: (MenuItem | "sep")[] = [
    { label: "Dashboard", href: "/admin/", icon: "dashboard", sub: [{ label: "Home", href: "/admin/" }] },
    "sep",
    {
      label: "Posts",
      href: "/admin/posts/",
      icon: "posts",
      match: ["/admin/posts/", "/admin/categories/", "/admin/tags/"],
      sub: [
        { label: "All Posts", href: "/admin/posts/" },
        { label: "Add New Post", href: "/admin/posts/new/" },
        { label: "Categories", href: "/admin/categories/" },
        { label: "Tags", href: "/admin/tags/" },
      ],
    },
    {
      label: "Media",
      href: "/admin/media/",
      icon: "media",
      sub: [
        { label: "Library", href: "/admin/media/" },
        { label: "Add New Media File", href: "/admin/media/new/" },
      ],
    },
    {
      label: "Pages",
      href: "/admin/pages/",
      icon: "pages",
      sub: [
        { label: "All Pages", href: "/admin/pages/" },
        { label: "Add New Page", href: "/admin/pages/new/" },
      ],
    },
    { label: "Comments", href: "/admin/comments/", icon: "comments", count: pendingComments },
    "sep",
    {
      label: "Rank Math SEO",
      href: "/admin/seo/",
      icon: "seo",
      match: ["/admin/seo/", "/admin/settings/seo/"],
      sub: [
        { label: "SEO Analysis", href: "/admin/seo/" },
        ...(isAdmin ? [{ label: "Titles & Meta", href: "/admin/settings/seo/" }] : []),
      ],
    },
    {
      label: "Users",
      href: "/admin/users/",
      icon: "users",
      adminOnly: true,
      sub: [{ label: "All Users", href: "/admin/users/" }],
    },
    {
      label: "Settings",
      href: "/admin/settings/",
      icon: "settings",
      adminOnly: true,
      match: ["/admin/settings/general/", "/admin/settings/reading/", "/admin/settings/discussion/"],
      sub: [
        { label: "General", href: "/admin/settings/general/" },
        { label: "Reading", href: "/admin/settings/reading/" },
        { label: "Discussion", href: "/admin/settings/discussion/" },
      ],
    },
  ];

  const isCurrent = (item: MenuItem) => {
    if (item.href === "/admin/") return pathname === "/admin/" || pathname === "/admin";
    const prefixes = item.match ?? [item.href];
    return prefixes.some((p) => pathname.startsWith(p));
  };
  // The most specific submenu link that matches the current page
  const currentSub = (item: MenuItem) => {
    const subs = item.sub ?? [];
    const exact = subs.find((s) => s.href === pathname);
    if (exact) return exact.href;
    if (pathname.endsWith("/new/")) return null;
    return subs.filter((s) => pathname.startsWith(s.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
  };

  return (
    <div className="wp-admin">
      <div className="wp-adminbar">
        <button className="mobile-only" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
          {Icons.menu}
        </button>
        <div className="ab-group">
          <Link href="/" target="_blank">
            {Icons.home}
            <span className="ab-label">{siteName}</span>
          </Link>
          <div className="ab-sub">
            <Link href="/" target="_blank">Visit Site</Link>
          </div>
        </div>
        {pendingComments > 0 && (
          <Link href="/admin/comments/?comment_status=moderated" title={`${pendingComments} comments in moderation`}>
            {Icons.comments}
            <span>{pendingComments}</span>
          </Link>
        )}
        <div className="ab-group">
          <Link href="/admin/posts/new/">
            {Icons.plus}
            <span className="ab-label">New</span>
          </Link>
          <div className="ab-sub">
            <Link href="/admin/posts/new/">Post</Link>
            <Link href="/admin/media/new/">Media</Link>
            <Link href="/admin/pages/new/">Page</Link>
          </div>
        </div>
        <div className="ab-group ab-right">
          <button type="button">
            <span className="ab-label">Howdy,</span> <strong>{userName}</strong>
          </button>
          <div className="ab-sub">
            <Link href="/account/">Edit Profile</Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push("/");
                router.refresh();
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      <nav className={`wp-menu flyouts ${folded ? "folded" : ""} ${mobileOpen ? "mobile-open" : ""}`} aria-label="Main menu">
        <ul>
          {menu.map((item, i) => {
            if (item === "sep") return <li key={`sep-${i}`} className="separator" />;
            if (item.adminOnly && !isAdmin) return null;
            const current = isCurrent(item);
            const sub = current ? currentSub(item) : null;
            return (
              <li key={item.href} className={`menu-top ${current ? "current" : ""}`}>
                <Link href={item.href} aria-current={current ? "page" : undefined}>
                  {Icons[item.icon]}
                  <span className="menu-label">
                    {item.label}
                    {!!item.count && <span className="count">{item.count}</span>}
                  </span>
                </Link>
                {item.sub && item.sub.length > 1 && (
                  <ul className="submenu">
                    {item.sub.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} className={s.href === sub ? "current" : ""}>
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <button type="button" className="collapse" onClick={toggleFold}>
          <span style={{ transform: folded ? "rotate(180deg)" : undefined, display: "inline-flex" }}>{Icons.collapse}</span>
          <span className="menu-label">Collapse Menu</span>
        </button>
      </nav>

      <div className={`wp-content ${folded ? "folded" : ""}`}>{children}</div>
    </div>
  );
}
