import { describe, expect, it } from "vitest";
import {
  canOpenPath,
  isNavItemActive,
  isPathReleased,
  navItems,
  pathOfUnderDevelopmentSlug,
  underDevelopmentSlugOf,
} from "./screenAccess";

const marketingViewer = [{ area: "MARKETING", level: "view" }] as const;
const mvpRelease = ["MARKETING", "ORDERS"] as const;

describe("canOpenPath", () => {
  it("opens everything for unrestricted access", () => {
    expect(canOpenPath("/loja", null)).toBe(true);
    expect(canOpenPath("/dinheiro", null)).toBe(true);
  });

  it("keeps shared screens open and area screens behind the grant", () => {
    expect(canOpenPath("/", marketingViewer)).toBe(true);
    expect(canOpenPath("/conexoes", marketingViewer)).toBe(true);
    expect(canOpenPath("/marketing", marketingViewer)).toBe(true);
    expect(canOpenPath("/influenciadores", marketingViewer)).toBe(true);
    expect(canOpenPath("/dinheiro", marketingViewer)).toBe(false);
    expect(canOpenPath("/loja", marketingViewer)).toBe(false);
  });
});

describe("isPathReleased", () => {
  it("never locks staff nor the screens outside the release list", () => {
    expect(isPathReleased("/dinheiro", null)).toBe(true);
    expect(isPathReleased("/", mvpRelease)).toBe(true);
    expect(isPathReleased("/conexoes", mvpRelease)).toBe(true);
    expect(isPathReleased("/loja", mvpRelease)).toBe(true);
  });

  it("locks a client's screens that the store has not released", () => {
    expect(isPathReleased("/marketing", mvpRelease)).toBe(true);
    expect(isPathReleased("/pedidos", mvpRelease)).toBe(true);
    expect(isPathReleased("/dinheiro", mvpRelease)).toBe(false);
    expect(isPathReleased("/assistente", mvpRelease)).toBe(false);
  });
});

describe("under development slugs", () => {
  it("round-trips a locked path and rejects unknown ones", () => {
    expect(underDevelopmentSlugOf("/pedidos")).toBe("pedidos");
    expect(pathOfUnderDevelopmentSlug("pedidos")).toBe("/pedidos");
    expect(pathOfUnderDevelopmentSlug("loja")).toBeNull();
    expect(pathOfUnderDevelopmentSlug("")).toBeNull();
  });
});

describe("navItems", () => {
  const items = [{ to: "/" }, { to: "/dinheiro" }, { to: "/marketing" }];

  it("hides what the grant forbids and locks what the store has not released", () => {
    expect(navItems(items, marketingViewer, mvpRelease, mvpRelease)).toEqual([
      { to: "/", locked: false, hiddenFromClient: false },
      { to: "/marketing", locked: false, hiddenFromClient: false },
    ]);
    expect(navItems(items, null, mvpRelease, mvpRelease)).toEqual([
      { to: "/", locked: false, hiddenFromClient: false },
      { to: "/dinheiro", locked: true, hiddenFromClient: true },
      { to: "/marketing", locked: false, hiddenFromClient: false },
    ]);
  });

  it("shows staff everything and only flags what the client will not see", () => {
    expect(navItems(items, null, null, mvpRelease)).toEqual([
      { to: "/", locked: false, hiddenFromClient: false },
      { to: "/dinheiro", locked: false, hiddenFromClient: true },
      { to: "/marketing", locked: false, hiddenFromClient: false },
    ]);
  });
});

describe("isNavItemActive", () => {
  it("matches an open item by path and a locked one by the placeholder slug", () => {
    expect(
      isNavItemActive({ to: "/pedidos", locked: false }, { pathname: "/pedidos", tela: undefined }),
    ).toBe(true);
    expect(
      isNavItemActive(
        { to: "/pedidos", locked: true },
        { pathname: "/em-desenvolvimento", tela: "pedidos" },
      ),
    ).toBe(true);
    expect(
      isNavItemActive(
        { to: "/dinheiro", locked: true },
        { pathname: "/em-desenvolvimento", tela: "pedidos" },
      ),
    ).toBe(false);
  });
});
