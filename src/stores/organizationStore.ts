import { create } from "zustand";

export type Organization = {
  id: string;
  name: string;
  role: string;
  memberCount: number;
};

type OrganizationState = {
  organizations: Organization[];
  activeOrganizationId: string;
  setActiveOrganization: (organizationId: string) => void;
};

const organizations: Organization[] = [
  {
    id: "workly-korea",
    name: "Workly Korea",
    role: "관리자",
    memberCount: 32,
  },
  {
    id: "workly-labs",
    name: "Workly Labs",
    role: "멤버",
    memberCount: 14,
  },
];

const getInitialOrganizationId = () => {
  if (typeof window === "undefined") {
    return organizations[0].id;
  }

  const storedOrganizationId = localStorage.getItem(
    "workly-active-organization",
  );

  return organizations.some(({ id }) => id === storedOrganizationId)
    ? storedOrganizationId!
    : organizations[0].id;
};

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizations,
  activeOrganizationId: getInitialOrganizationId(),
  setActiveOrganization: (organizationId) => {
    const organizationExists = organizations.some(
      ({ id }) => id === organizationId,
    );

    if (!organizationExists) {
      return;
    }

    localStorage.setItem("workly-active-organization", organizationId);
    set({ activeOrganizationId: organizationId });
  },
}));

export const selectActiveOrganization = (state: OrganizationState) =>
  state.organizations.find(({ id }) => id === state.activeOrganizationId) ??
  state.organizations[0];
