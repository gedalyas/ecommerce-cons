import { describe, expect, it } from "vitest";
import type { AdminUser } from "./admin.types";
import {
  filterAdminUsers,
  groupUsersByConsultant,
  initialsOf,
  matchesUserQuery,
} from "./adminUsers";

const user = (over: Partial<AdminUser> & Pick<AdminUser, "id" | "name">): AdminUser => ({
  email: `${over.id}@loja.dev`,
  role: "CLIENT",
  membership: "OWNER",
  storeId: "s1",
  storeName: "Loja",
  consultantIds: [],
  createdAt: "2026-09-01T00:00:00.000Z",
  ...over,
});

const users = [
  user({ id: "ana", name: "Ana Clara", consultantIds: ["c1"] }),
  user({ id: "bia", name: "Bia Souza", consultantIds: ["c1", "c2"] }),
  user({ id: "caio", name: "Caio", consultantIds: [] }),
  user({ id: "cons", name: "Carla Consultora", role: "CONSULTANT", membership: null }),
  user({ id: "adm", name: "Davi Admin", role: "ADMIN", membership: null }),
];
const consultants = [
  { id: "c1", name: "Carla Consultora", email: "carla@x.dev" },
  { id: "c2", name: "Diego", email: "diego@x.dev" },
  { id: "c3", name: "Sem clientes", email: "s@x.dev" },
];

describe("matchesUserQuery", () => {
  it("ignores accents and case and matches name or e-mail", () => {
    expect(matchesUserQuery({ name: "João Antônio", email: "j@x.dev" }, "joao")).toBe(true);
    expect(matchesUserQuery({ name: "Ana", email: "ana.silva@x.dev" }, "SILVA")).toBe(true);
    expect(matchesUserQuery({ name: "Ana", email: "ana@x.dev" }, "bia")).toBe(false);
    expect(matchesUserQuery({ name: "Ana", email: "ana@x.dev" }, "  ")).toBe(true);
  });
});

describe("filterAdminUsers", () => {
  it("combines the text query with the consultant", () => {
    expect(filterAdminUsers(users, { query: "", consultantId: "c2" }).map((u) => u.id)).toEqual([
      "bia",
    ]);
    expect(filterAdminUsers(users, { query: "a", consultantId: "c1" }).map((u) => u.id)).toEqual([
      "ana",
      "bia",
    ]);
    expect(filterAdminUsers(users, { query: "", consultantId: "" })).toHaveLength(5);
  });
});

describe("groupUsersByConsultant", () => {
  it("lists clients under each consultant, then the unassigned, then the staff", () => {
    const groups = groupUsersByConsultant(users, consultants);
    expect(groups.map((g) => [g.title, g.users.map((u) => u.id)])).toEqual([
      ["Consultor: Carla Consultora", ["ana", "bia"]],
      ["Consultor: Diego", ["bia"]],
      ["Sem consultor", ["caio"]],
      ["Equipe", ["cons", "adm"]],
    ]);
  });

  it("returns nothing for an empty tenant", () => {
    expect(groupUsersByConsultant([], consultants)).toEqual([]);
  });
});

describe("initialsOf", () => {
  it("takes the first and last name", () => {
    expect(initialsOf("Ana Clara Crosara de Bastos")).toBe("AB");
    expect(initialsOf("caio")).toBe("C");
    expect(initialsOf("  ")).toBe("");
  });
});
