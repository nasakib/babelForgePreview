/**
 * Local-only "demo" multi-tenant auth database.
 *
 * SWAP-OUT BOUNDARY
 * ─────────────────
 * This implements system-wide multi-tenancy in local storage.
 * It manages persistent tables of Organizations and Users.
 * Swapping for a real OIDC/SAML backend requires only updating this client.
 */

import { Organization, Session, User } from "./types";

const SESSION_KEY = "babelforge:auth:session:v1";
const ORGS_KEY = "babelforge:auth:organizations:v2";
const USERS_KEY = "babelforge:auth:users:v2";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => {
    try { l(); } catch { /* swallow */ }
  });
}

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Session;
    if (new Date(v.expiresAt).getTime() < Date.now()) return null;
    return v;
  } catch {
    return null;
  }
}

function writeSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else window.localStorage.removeItem(SESSION_KEY);
  emit();
}

function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${(crypto as any).randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "??";
}

function readOrgs(): Organization[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORGS_KEY);
    if (!raw) {
      // Seed default UNSC clinical organization for Halsey reference
      const seed: Organization[] = [
        {
          id: "org_unsc_oni",
          name: "UNSC ONI Section III",
          plan: "preview",
          baaSigned: false,
          createdAt: new Date().toISOString(),
        }
      ];
      window.localStorage.setItem(ORGS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Organization[];
  } catch {
    return [];
  }
}

function writeOrgs(list: Organization[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORGS_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

function readUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) {
      // Seed default Dr. Halsey admin user and Master Chief patient user
      const seed: User[] = [
        {
          id: "usr_halsey",
          name: "Dr. Catherine Elizabeth Halsey",
          email: "c.halsey@unsc.gov",
          initials: "CH",
          role: "owner",
          orgId: "org_unsc_oni",
        },
        {
          id: "usr_masterchief",
          name: "John Spartan-117",
          email: "j.117@unsc.gov",
          initials: "JS",
          role: "patient",
          orgId: "org_unsc_oni",
        }
      ];
      window.localStorage.setItem(USERS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

function writeUsers(list: User[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export interface SignInInput {
  name: string;
  email: string;
  orgName?: string;
  role?: User["role"];
  orgId?: string; // Existing organization to join (for staff join codes)
}

export const authClient = {
  getSession(): Session | null {
    return readSession();
  },

  listOrganizations(): Organization[] {
    return readOrgs();
  },

  listStaff(orgId: string): User[] {
    return readUsers().filter((u) => u.orgId === orgId);
  },

  async createStaffUser(orgId: string, { name, email, role }: { name: string; email: string; role: User["role"] }): Promise<User> {
    const user: User = {
      id: uid("usr"),
      name: name.trim(),
      email: email.trim(),
      initials: initialsOf(name),
      role,
      orgId,
    };
    const list = readUsers();
    // Prevent duplicate emails within the same organization
    if (list.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.orgId === orgId)) {
      throw new Error("A practitioner with this email is already registered in your organization.");
    }
    list.push(user);
    writeUsers(list);
    emit();
    return user;
  },

  async signIn({ name, email, orgName, role = "clinician", orgId }: SignInInput): Promise<Session> {
    const now = new Date();
    const expires = new Date(now.getTime() + 1000 * 60 * 60 * 12); // 12h

    let targetOrg: Organization;
    let targetUser: User;

    if (role === "owner") {
      // 1. REGISTERING A NEW CLINICAL ORGANIZATION
      const newOrgId = uid("org");
      targetOrg = {
        id: newOrgId,
        name: (orgName || `${name.split(" ")[0] ?? "Personal"} Workspace`).trim(),
        plan: "preview",
        baaSigned: false,
        createdAt: now.toISOString(),
      };
      
      const orgs = readOrgs();
      orgs.push(targetOrg);
      writeOrgs(orgs);

      targetUser = {
        id: uid("usr"),
        name: name.trim(),
        email: email.trim() || `${name.replace(/\s+/g, "").toLowerCase()}@babelforge.local`,
        initials: initialsOf(name),
        role: "owner",
        orgId: newOrgId,
      };

      const users = readUsers();
      users.push(targetUser);
      writeUsers(users);
    } else {
      // 2. JOINING AN EXISTING CLINICAL ORGANIZATION
      if (!orgId) {
        throw new Error("JOIN ERROR: You must select a registered Clinical Organization to join.");
      }
      
      const orgs = readOrgs();
      const foundOrg = orgs.find((o) => o.id === orgId);
      if (!foundOrg) {
        throw new Error("JOIN ERROR: The selected Clinical Organization could not be verified in the registry.");
      }
      targetOrg = foundOrg;

      const users = readUsers();
      let foundUser = users.find(
        (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.orgId === orgId
      );

      if (!foundUser) {
        // Create user linking them to the chosen orgId
        foundUser = {
          id: uid("usr"),
          name: name.trim(),
          email: email.trim(),
          initials: initialsOf(name),
          role,
          orgId,
        };
        users.push(foundUser);
        writeUsers(users);
      } else {
        // Update role if logging back into this organization
        foundUser.role = role;
        writeUsers(users);
      }
      targetUser = foundUser;
    }

    const session: Session = {
      user: targetUser,
      org: targetOrg,
      issuedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    writeSession(session);
    return session;
  },

  async signOut(): Promise<void> {
    writeSession(null);
  },

  async updateSession({
    name,
    orgName,
    plan,
    baaSigned,
  }: {
    name?: string;
    orgName?: string;
    plan?: Organization["plan"];
    baaSigned?: boolean;
  }): Promise<Session> {
    const s = readSession();
    if (!s) throw new Error("No active session to update.");

    // Update active user in session and users database
    const users = readUsers();
    const uIdx = users.findIndex((u) => u.id === s.user.id);
    if (name !== undefined) {
      s.user.name = name.trim();
      s.user.initials = initialsOf(name);
      if (uIdx >= 0) {
        users[uIdx].name = name.trim();
        users[uIdx].initials = initialsOf(name);
      }
    }
    writeUsers(users);

    // Update active org in session and organizations database
    const orgs = readOrgs();
    const oIdx = orgs.findIndex((o) => o.id === s.org.id);
    if (orgName !== undefined) {
      s.org.name = orgName.trim();
      if (oIdx >= 0) orgs[oIdx].name = orgName.trim();
    }
    if (plan !== undefined) {
      s.org.plan = plan;
      if (oIdx >= 0) orgs[oIdx].plan = plan;
    }
    if (baaSigned !== undefined) {
      s.org.baaSigned = baaSigned;
      if (oIdx >= 0) orgs[oIdx].baaSigned = baaSigned;
    }

    writeOrgs(orgs);
    writeSession(s);
    return s;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
